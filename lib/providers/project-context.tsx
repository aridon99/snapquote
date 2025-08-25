'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Project, ProjectSession } from '@/types/database'
import { useRouter, useSearchParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ProjectContextValue {
  // Current project state
  currentProject: Project | null
  allProjects: Project[]
  recentProjects: Project[]
  isLoading: boolean
  error: string | null
  
  // Project actions
  setCurrentProject: (project: Project | null) => void
  switchToProject: (projectId: string) => Promise<void>
  refreshProject: () => Promise<void>
  refreshAllProjects: () => Promise<void>
  
  // Session management
  activeSessions: ProjectSession[]
  currentUserSession: ProjectSession | null
  startSession: (projectId: string) => Promise<void>
  endSession: () => Promise<void>
  updateActivity: () => Promise<void>
  
  // URL management
  getProjectUrl: (projectId: string, userRole?: 'owner' | 'advisor') => string
  navigateToProject: (projectId: string, userRole?: 'owner' | 'advisor') => void
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
}

interface ProjectProviderProps {
  children: React.ReactNode
  userRole: 'owner' | 'advisor' | 'contractor'
}

export function ProjectProvider({ children, userRole }: ProjectProviderProps) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSessions, setActiveSessions] = useState<ProjectSession[]>([])
  const [currentUserSession, setCurrentUserSession] = useState<ProjectSession | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current user
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getCurrentUser()
  }, [])

  // Load initial data
  useEffect(() => {
    if (currentUser) {
      loadInitialData()
    }
  }, [currentUser])

  // Handle URL-based project selection
  useEffect(() => {
    try {
      const projectParam = searchParams?.get('project')
      if (projectParam && allProjects.length > 0) {
        const project = allProjects.find(p => 
          p.id === projectParam || 
          p.reference_code === projectParam
        )
        if (project && project.id !== currentProject?.id) {
          setCurrentProject(project)
          startSession(project.id)
        }
      }
    } catch (error) {
      console.warn('Error handling project URL parameter:', error)
    }
  }, [searchParams, allProjects, currentProject])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        refreshAllProjects(),
        loadRecentProjects()
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project data')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAllProjects = async () => {
    if (!currentUser) return

    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_homeowner_id_fkey (full_name, email, phone)
        `)
        .order('last_viewed_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })

      // Filter based on user role
      if (userRole === 'owner') {
        query = query.eq('homeowner_id', currentUser.id)
      }

      const { data, error } = await query

      if (error) throw error
      setAllProjects(data || [])
    } catch (err) {
      console.error('Error loading projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    }
  }

  const loadRecentProjects = async () => {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq(userRole === 'owner' ? 'homeowner_id' : 'last_viewed_by', currentUser.id)
        .not('last_viewed_at', 'is', null)
        .order('last_viewed_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentProjects(data || [])
    } catch (err) {
      console.error('Error loading recent projects:', err)
    }
  }

  const refreshProject = async () => {
    if (!currentProject?.id) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_homeowner_id_fkey (full_name, email, phone)
        `)
        .eq('id', currentProject.id)
        .single()

      if (error) throw error
      setCurrentProject(data)
    } catch (err) {
      console.error('Error refreshing project:', err)
    }
  }

  const switchToProject = async (projectId: string) => {
    try {
      const project = allProjects.find(p => p.id === projectId)
      if (!project) {
        await refreshAllProjects()
        const refreshedProject = allProjects.find(p => p.id === projectId)
        if (!refreshedProject) {
          throw new Error('Project not found')
        }
        setCurrentProject(refreshedProject)
      } else {
        setCurrentProject(project)
      }
      
      await startSession(projectId)
      
      // Update URL
      if (typeof window !== 'undefined') {
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('project', project?.reference_code || projectId)
        router.push(currentUrl.pathname + currentUrl.search)
      }
    } catch (error) {
      console.error('Error switching project:', error)
      setError(error instanceof Error ? error.message : 'Failed to switch project')
    }
  }

  const startSession = async (projectId: string) => {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('project_sessions')
        .upsert({
          project_id: projectId,
          user_id: currentUser.id,
          user_role: userRole,
          last_activity: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'project_id,user_id'
        })
        .select()
        .single()

      if (error) throw error
      setCurrentUserSession(data)

      // Update project's last_viewed_by
      await supabase
        .from('projects')
        .update({
          last_viewed_by: currentUser.id,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', projectId)

    } catch (err) {
      console.error('Error starting session:', err)
    }
  }

  const endSession = async () => {
    if (!currentUserSession) return

    try {
      await supabase
        .from('project_sessions')
        .update({ is_active: false })
        .eq('id', currentUserSession.id)

      setCurrentUserSession(null)
    } catch (err) {
      console.error('Error ending session:', err)
    }
  }

  const updateActivity = async () => {
    if (!currentUserSession) return

    try {
      await supabase
        .from('project_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', currentUserSession.id)
    } catch (err) {
      console.error('Error updating activity:', err)
    }
  }

  const getProjectUrl = (projectId: string, targetRole?: 'owner' | 'advisor') => {
    const role = targetRole || userRole
    const project = allProjects.find(p => p.id === projectId)
    const projectParam = project?.reference_code || projectId
    
    if (role === 'advisor') {
      return `/advisor/dashboard?project=${projectParam}`
    } else {
      return `/owner/dashboard?project=${projectParam}`
    }
  }

  const navigateToProject = (projectId: string, targetRole?: 'owner' | 'advisor') => {
    const url = getProjectUrl(projectId, targetRole)
    router.push(url)
  }

  // Real-time subscriptions
  useEffect(() => {
    if (!currentProject?.id) return

    // Subscribe to project changes
    const projectSubscription = supabase
      .channel(`project-${currentProject.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${currentProject.id}` },
        () => {
          refreshProject()
        }
      )
      .subscribe()

    // Subscribe to active sessions for this project
    const sessionsSubscription = supabase
      .channel(`project-sessions-${currentProject.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'project_sessions', filter: `project_id=eq.${currentProject.id}` },
        async () => {
          const { data } = await supabase
            .from('project_sessions')
            .select(`
              *,
              profiles!project_sessions_user_id_fkey (full_name, email)
            `)
            .eq('project_id', currentProject.id)
            .eq('is_active', true)

          setActiveSessions(data || [])
        }
      )
      .subscribe()

    return () => {
      projectSubscription.unsubscribe()
      sessionsSubscription.unsubscribe()
    }
  }, [currentProject?.id])

  // Update activity periodically
  useEffect(() => {
    if (!currentUserSession) return

    const interval = setInterval(() => {
      updateActivity()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [currentUserSession])

  const value: ProjectContextValue = {
    currentProject,
    allProjects,
    recentProjects,
    isLoading,
    error,
    setCurrentProject,
    switchToProject,
    refreshProject,
    refreshAllProjects,
    activeSessions,
    currentUserSession,
    startSession,
    endSession,
    updateActivity,
    getProjectUrl,
    navigateToProject,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}