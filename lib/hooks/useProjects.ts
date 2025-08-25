import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Project, IntakeFormData } from '@/types/database'
import { toast } from 'react-hot-toast'

const supabase = createClient()

// Query Keys
const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// Fetch user's projects
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async (): Promise<Project[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('homeowner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })
}

// Fetch single project
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

// Create new project
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: IntakeFormData): Promise<Project> => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create project')
      }

      const result = await response.json()
      return result.project
    },
    onSuccess: (data) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      
      // Add the new project to the cache
      queryClient.setQueryData(projectKeys.detail(data.id), data)
      
      toast.success('Project created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project')
    },
  })
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      updates 
    }: { 
      projectId: string
      updates: Partial<Project> 
    }): Promise<Project> => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(data.id), data)
      
      // Invalidate projects list to reflect changes
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      
      toast.success('Project updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update project')
    },
  })
}

// Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
    },
    onSuccess: (_, projectId) => {
      // Remove project from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) })
      
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      
      toast.success('Project deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete project')
    },
  })
}

// Prefetch project data
export function usePrefetchProject() {
  const queryClient = useQueryClient()

  return (projectId: string) => {
    queryClient.prefetchQuery({
      queryKey: projectKeys.detail(projectId),
      queryFn: async (): Promise<Project> => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (error) throw error
        return data
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    })
  }
}