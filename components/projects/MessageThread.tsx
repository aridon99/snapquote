'use client'

import { useState, useEffect, useRef } from 'react'
import { Message, Profile } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Paperclip, AlertCircle } from 'lucide-react'
import { formatDateRelative } from '@/lib/utils/date'
import { useRealtimeMessages } from '@/lib/hooks/useRealtime'
import { toast } from 'react-hot-toast'

interface MessageThreadProps {
  projectId: string
  currentUserId: string
}

interface MessageWithProfile extends Message {
  sender: Profile
}

export function MessageThread({ projectId, currentUserId }: MessageThreadProps) {
  const [messages, setMessages] = useState<MessageWithProfile[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isActionItem, setIsActionItem] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load initial messages
  useEffect(() => {
    loadMessages()
  }, [projectId])

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(*)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages(prev => [...prev, newMessage as MessageWithProfile])
            scrollToBottom()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data as MessageWithProfile[] || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          project_id: projectId,
          sender_id: currentUserId,
          content: newMessage,
          is_action_item: isActionItem
        })

      if (error) throw error

      setNewMessage('')
      setIsActionItem(false)
      toast.success('Message sent')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading messages...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Project Communication</CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-4 px-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] ${
                  message.sender_id === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                } rounded-lg p-3`}
              >
                {/* Sender name (if not current user) */}
                {message.sender_id !== currentUserId && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {message.sender.full_name?.charAt(0) || message.sender.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {message.sender.full_name || message.sender.email}
                    </span>
                  </div>
                )}

                {/* Message content */}
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                {/* Action item badge */}
                {message.is_action_item && (
                  <div className="flex items-center mt-2">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Action Item
                    </Badge>
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-xs mt-2 ${
                  message.sender_id === currentUserId ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatDateRelative(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message input */}
      <CardContent className="border-t bg-gray-50 p-4">
        <div className="space-y-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[60px] resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActionItem}
                  onChange={(e) => setIsActionItem(e.target.checked)}
                  className="rounded"
                />
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span>Mark as action item</span>
              </label>
              
              <Button variant="ghost" size="sm" disabled>
                <Paperclip className="w-4 h-4 mr-2" />
                Attach File
              </Button>
            </div>

            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}