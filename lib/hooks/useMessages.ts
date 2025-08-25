import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types/database'
import { useRealtimeMessages } from './useRealtime'
import { toast } from 'react-hot-toast'
import { useEffect } from 'react'

const supabase = createClient()

interface MessageWithProfile extends Message {
  sender: {
    id: string
    full_name: string | null
    role: string
    avatar_url: string | null
  }
}

// Query Keys
const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (projectId: string) => [...messageKeys.lists(), projectId] as const,
}

// Fetch messages for a project
export function useMessages(projectId: string) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: messageKeys.list(projectId),
    queryFn: async (): Promise<MessageWithProfile[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as MessageWithProfile[] || []
    },
    enabled: !!projectId,
  })

  // Set up real-time subscription
  useRealtimeMessages(projectId, (newMessage) => {
    queryClient.setQueryData(
      messageKeys.list(projectId),
      (oldData: MessageWithProfile[] | undefined) => {
        if (!oldData) return [newMessage as MessageWithProfile]
        
        // Check if message already exists (prevent duplicates)
        const exists = oldData.some(msg => msg.id === newMessage.id)
        if (exists) return oldData
        
        return [...oldData, newMessage as MessageWithProfile]
      }
    )
  })

  return query
}

// Send a message
export function useSendMessage(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      content,
      isActionItem = false,
      mentions = []
    }: {
      content: string
      isActionItem?: boolean
      mentions?: string[]
    }): Promise<MessageWithProfile> => {
      const response = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          is_action_item: isActionItem,
          mentions
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const result = await response.json()
      return result.data
    },
    onSuccess: (data) => {
      // Optimistically add message to cache
      queryClient.setQueryData(
        messageKeys.list(projectId),
        (oldData: MessageWithProfile[] | undefined) => {
          if (!oldData) return [data]
          return [...oldData, data]
        }
      )
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message')
    },
  })
}

// Mark messages as read
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      messageIds
    }: {
      projectId: string
      messageIds: string[]
    }): Promise<void> => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('project_id', projectId)
        .in('id', messageIds)

      if (error) throw error
    },
    onSuccess: (_, { projectId }) => {
      // Invalidate messages to reflect read status
      queryClient.invalidateQueries({ queryKey: messageKeys.list(projectId) })
    },
  })
}

// Get unread message count
export function useUnreadMessageCount(projectId: string) {
  return useQuery({
    queryKey: [...messageKeys.list(projectId), 'unread-count'],
    queryFn: async (): Promise<number> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('is_read', false)
        .neq('sender_id', user.id) // Don't count own messages

      if (error) throw error
      return count || 0
    },
    enabled: !!projectId,
  })
}

// Get action items from messages
export function useActionItems(projectId: string) {
  return useQuery({
    queryKey: [...messageKeys.list(projectId), 'action-items'],
    queryFn: async (): Promise<MessageWithProfile[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            full_name,
            role,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .eq('is_action_item', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MessageWithProfile[] || []
    },
    enabled: !!projectId,
  })
}

// Delete a message (if user is sender or project owner)
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      messageId,
      projectId
    }: {
      messageId: string
      projectId: string
    }): Promise<void> => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
    },
    onSuccess: (_, { projectId, messageId }) => {
      // Remove message from cache
      queryClient.setQueryData(
        messageKeys.list(projectId),
        (oldData: MessageWithProfile[] | undefined) => {
          if (!oldData) return []
          return oldData.filter(msg => msg.id !== messageId)
        }
      )
      
      toast.success('Message deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete message')
    },
  })
}