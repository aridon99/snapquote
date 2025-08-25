'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ChatMessage } from './types'

interface ChatbotWidgetProps {
  className?: string
}

export function ChatbotWidget({ className }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm Emma, your renovation assistant. I'm here to help you understand how RenovationAdvisor can make your renovation project smooth and stress-free. What brings you here today - are you planning a specific project, or just exploring your options?",
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('chatbot-session-id')
      if (stored) return stored
      
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('chatbot-session-id', newSessionId)
      return newSessionId
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages,
          conversationId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Store conversation ID from first response
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: 'bot',
        timestamp: new Date(),
        metadata: data.metadata
      }

      setMessages(prev => [...prev, botMessage])


      // Mark as unread if chat is minimized or closed
      if (isMinimized || !isOpen) {
        setHasUnread(true)
      }

    } catch (error) {
      console.error('Chatbot error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having a technical moment. While I sort this out, you can call us directly at (555) 123-4567 or submit our intake form on the website.",
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      // Restore focus to input field after message is sent
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const openChat = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setHasUnread(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const closeChat = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }


  if (!isOpen) {
    return (
      <div 
        className={`fixed bottom-6 right-6 z-50 ${className}`}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999
        }}
      >
        <Button
          onClick={openChat}
          size="lg"
          className="rounded-full h-14 w-14 bg-kurtis-accent hover:bg-kurtis-black shadow-lg hover:shadow-xl transition-all duration-200 relative border-2 border-white"
          style={{
            position: 'relative',
            zIndex: 9999
          }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
          {hasUnread && (
            <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 bg-red-500 border-2 border-white" />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999
      }}
    >
      <Card className={`w-96 max-w-[400px] transition-all duration-300 ${
        isMinimized ? 'h-14' : 'h-[500px]'
      } shadow-xl border border-gray-200 bg-white opacity-100`}
      style={{ backgroundColor: 'white', opacity: 1 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-kurtis-accent text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="font-semibold text-sm">Emma</h3>
              <p className="text-xs opacity-90">Renovation Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMinimize}
              className="text-white hover:bg-kurtis-black h-8 w-8 p-0"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="text-white hover:bg-kurtis-black h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 h-[340px] bg-white opacity-100" style={{ backgroundColor: 'white' }}>
              <div className="space-y-4">
                {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg text-sm ${
                          message.sender === 'user'
                            ? '!bg-blue-500 !text-white'
                            : '!bg-green-100 !text-green-800 !border !border-green-200'
                        }`}
                        style={{
                          backgroundColor: message.sender === 'user' ? '#3b82f6' : '#dcfce7',
                          color: message.sender === 'user' ? '#ffffff' : '#166534',
                          border: message.sender === 'user' ? 'none' : '1px solid #bbf7d0',
                          fontWeight: message.sender === 'user' ? '500' : '400'
                        }}
                      >
                        <span style={{ color: message.sender === 'user' ? '#ffffff' : '#166534' }}>
                          {message.content}
                        </span>
                      </div>
                    </div>
                  )
                )}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-white opacity-100" style={{ backgroundColor: 'white' }}>
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="bg-kurtis-accent hover:bg-kurtis-black"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by RenovationAdvisor
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default ChatbotWidget