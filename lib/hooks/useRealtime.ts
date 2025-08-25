import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMessages(projectId: string, onNewMessage?: (message: any) => void) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!projectId) return

    const messageChannel = supabase
      .channel(`project-${projectId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('New message received:', payload)
          if (onNewMessage) {
            onNewMessage(payload.new)
          }
        }
      )
      .subscribe()

    setChannel(messageChannel)

    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel)
      }
    }
  }, [projectId, onNewMessage, supabase])

  return channel
}

export function useRealtimeProjectUpdates(projectId: string, onProjectUpdate?: (project: any) => void) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!projectId) return

    const projectChannel = supabase
      .channel(`project-${projectId}-updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          console.log('Project updated:', payload)
          if (onProjectUpdate) {
            onProjectUpdate(payload.new)
          }
        }
      )
      .subscribe()

    setChannel(projectChannel)

    return () => {
      if (projectChannel) {
        supabase.removeChannel(projectChannel)
      }
    }
  }, [projectId, onProjectUpdate, supabase])

  return channel
}

export function useRealtimeBudgetUpdates(projectId: string, onBudgetUpdate?: (budgetItem: any) => void) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!projectId) return

    const budgetChannel = supabase
      .channel(`project-${projectId}-budget`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_items',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Budget item updated:', payload)
          if (onBudgetUpdate) {
            onBudgetUpdate(payload.new || payload.old)
          }
        }
      )
      .subscribe()

    setChannel(budgetChannel)

    return () => {
      if (budgetChannel) {
        supabase.removeChannel(budgetChannel)
      }
    }
  }, [projectId, onBudgetUpdate, supabase])

  return channel
}

export function useRealtimeUserPresence(projectId: string) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!projectId) return

    const presenceChannel = supabase
      .channel(`project-${projectId}-presence`)
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState()
        const users = Object.values(newState).flat()
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            })
          }
        }
      })

    setChannel(presenceChannel)

    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel)
      }
    }
  }, [projectId, supabase])

  return { onlineUsers, channel }
}