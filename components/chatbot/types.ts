export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  metadata?: {
    action?: 'request_lead_capture' | 'show_pricing' | 'schedule_consultation'
    category?: string
    sentiment?: 'positive' | 'negative' | 'neutral'
    leadQuality?: 'high' | 'medium' | 'low'
    projectType?: string
    urgency?: 'immediate' | 'planning' | 'exploring'
  }
}

export interface LeadData {
  name: string
  email: string
  phone: string
  preferredTime: 'morning' | 'afternoon' | 'evening'
  projectType?: string
  projectDetails?: string
  budget?: string
  timeline?: string
  address?: string
}

export interface ChatbotResponse {
  message: string
  metadata?: ChatMessage['metadata']
  suggestedActions?: string[]
}

export interface ConversationAnalytics {
  conversationId: string
  sessionId: string
  startTime: Date
  endTime?: Date
  messageCount: number
  leadCaptured: boolean
  leadData?: LeadData
  userSentiment: 'positive' | 'negative' | 'neutral'
  topicsDiscussed: string[]
  exitPoint?: 'lead_captured' | 'user_left' | 'satisfied' | 'frustrated'
}