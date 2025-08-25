'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Message {
  id: string
  content: string
  sender_name: string
  sender_id: string
  created_at: string
}

interface RenovationChatbotProps {
  projectId: string
  className?: string
}

export default function RenovationChatbot({ 
  projectId, 
  className = "" 
}: RenovationChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory()
    }
  }, [isOpen, projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat?projectId=${projectId}&limit=50`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
      } else {
        console.error('Failed to load chat history:', data.error)
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || loading) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setLoading(true)

    // Add user message immediately to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender_name: 'You',
      sender_id: 'current_user',
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          projectId,
          threadId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender_name: 'AI Assistant',
          sender_id: 'system',
          created_at: data.timestamp
        }

        setMessages(prev => [...prev, aiMessage])
        setThreadId(data.threadId)
      } else {
        toast.error(data.error || 'Failed to send message')
        // Remove the user message if request failed
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
      }
    } catch (error) {
      toast.error('Failed to send message')
      // Remove the user message if request failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'h:mm a')
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg ${className}`}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 h-[500px] shadow-xl ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Renovation Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask questions about your project
        </p>
      </CardHeader>

      <CardContent className="flex flex-col h-[400px] p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Start a conversation about your renovation project!</p>
                <p className="text-xs mt-1">
                  Ask about budget, timeline, materials, or permits
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_name === 'AI Assistant' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.sender_name === 'AI Assistant'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask about your project..."
              disabled={loading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={loading || !newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            AI assistant can help with project questions and guidance
          </p>
        </div>
      </CardContent>
    </Card>
  )
}