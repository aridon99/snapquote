'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Milestone } from '@/components/projects/ProjectTimeline'

interface MilestoneData {
  id?: string
  project_id: string
  title: string
  description: string
  due_date: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue'
  type: 'planning' | 'permits' | 'construction' | 'inspection' | 'payment'
  amount?: number
  assigned_to?: string
  completed_date?: string
  dependencies?: string[]
}

export function useMilestones(projectId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async (): Promise<Milestone[]> => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch milestones: ${error.message}`)
      }

      // Transform database format to component format
      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        dueDate: item.due_date,
        status: item.status,
        type: item.type,
        amount: item.amount,
        assignedTo: item.assigned_to,
        completedDate: item.completed_date,
        dependencies: item.dependencies
      }))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createMutation = useMutation({
    mutationFn: async (milestone: Omit<Milestone, 'id'>): Promise<Milestone> => {
      const milestoneData: Omit<MilestoneData, 'id'> = {
        project_id: projectId,
        title: milestone.title,
        description: milestone.description,
        due_date: milestone.dueDate,
        status: milestone.status,
        type: milestone.type,
        amount: milestone.amount,
        assigned_to: milestone.assignedTo,
        completed_date: milestone.completedDate,
        dependencies: milestone.dependencies
      }

      const { data, error } = await supabase
        .from('milestones')
        .insert(milestoneData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create milestone: ${error.message}`)
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        dueDate: data.due_date,
        status: data.status,
        type: data.type,
        amount: data.amount,
        assignedTo: data.assigned_to,
        completedDate: data.completed_date,
        dependencies: data.dependencies
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (milestone: Milestone): Promise<Milestone> => {
      const milestoneData: Partial<MilestoneData> = {
        title: milestone.title,
        description: milestone.description,
        due_date: milestone.dueDate,
        status: milestone.status,
        type: milestone.type,
        amount: milestone.amount,
        assigned_to: milestone.assignedTo,
        completed_date: milestone.completedDate,
        dependencies: milestone.dependencies
      }

      const { data, error } = await supabase
        .from('milestones')
        .update(milestoneData)
        .eq('id', milestone.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update milestone: ${error.message}`)
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        dueDate: data.due_date,
        status: data.status,
        type: data.type,
        amount: data.amount,
        assignedTo: data.assigned_to,
        completedDate: data.completed_date,
        dependencies: data.dependencies
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (milestoneId: string): Promise<void> => {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId)

      if (error) {
        throw new Error(`Failed to delete milestone: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      milestoneId, 
      status, 
      completedDate 
    }: { 
      milestoneId: string
      status: Milestone['status']
      completedDate?: string 
    }): Promise<void> => {
      const updateData: Partial<MilestoneData> = {
        status,
        completed_date: completedDate
      }

      const { error } = await supabase
        .from('milestones')
        .update(updateData)
        .eq('id', milestoneId)

      if (error) {
        throw new Error(`Failed to update milestone status: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
    }
  })

  return {
    milestones: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createMilestone: createMutation.mutate,
    updateMilestone: updateMutation.mutate,
    deleteMilestone: deleteMutation.mutate,
    updateMilestoneStatus: updateStatusMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}