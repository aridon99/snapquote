import { createClient } from '@/lib/supabase/server'

export interface AnalyticsEvent {
  event_type: string
  event_data?: Record<string, any>
  session_id?: string
  user_agent?: string
  ip_address?: string
  user_id?: string
  lead_id?: string
  project_id?: string
}

export interface ConversationMetrics {
  conversationId: string
  sessionId: string
  totalMessages: number
  duration: number
  leadCaptured: boolean
  leadId?: string
  exitPoint?: 'lead_captured' | 'user_left' | 'satisfied' | 'frustrated' | 'timeout'
  conversationRating?: number
  userSentiment?: 'positive' | 'negative' | 'neutral'
  topicsDiscussed: string[]
}

class AnalyticsService {
  private static instance: AnalyticsService
  private supabase: any

  private constructor() {
    // Singleton pattern to ensure one instance
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: event.event_type,
          event_data: event.event_data || {},
          session_id: event.session_id,
          user_agent: event.user_agent,
          ip_address: event.ip_address,
          user_id: event.user_id,
          lead_id: event.lead_id,
          project_id: event.project_id
        })

      if (error) {
        console.error('Failed to track analytics event:', error)
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }

  async startConversation(sessionId: string, userId?: string): Promise<string> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          session_id: sessionId,
          user_id: userId,
          conversation_data: { messages: [] },
          total_messages: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to start conversation tracking:', error)
        return sessionId // Fallback to session ID
      }

      await this.trackEvent({
        event_type: 'conversation_started',
        session_id: sessionId,
        user_id: userId,
        event_data: { conversationId: data.id }
      })

      return data.id
    } catch (error) {
      console.error('Conversation start error:', error)
      return sessionId
    }
  }

  async logMessage(
    conversationId: string,
    message: any,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      
      // Get current conversation data
      const { data: conversation, error: fetchError } = await supabase
        .from('chatbot_conversations')
        .select('conversation_data, total_messages')
        .eq('id', conversationId)
        .single()

      if (fetchError) {
        console.error('Failed to fetch conversation:', fetchError)
        return
      }

      const messages = conversation.conversation_data.messages || []
      messages.push({
        ...message,
        timestamp: new Date().toISOString()
      })

      // Update conversation with new message
      const { error: updateError } = await supabase
        .from('chatbot_conversations')
        .update({
          conversation_data: { messages },
          total_messages: messages.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (updateError) {
        console.error('Failed to update conversation:', updateError)
        return
      }

      // Track message event
      await this.trackEvent({
        event_type: 'message_sent',
        session_id: sessionId,
        user_id: userId,
        event_data: {
          conversationId,
          messageType: message.sender,
          messageLength: message.content?.length || 0,
          hasMetadata: !!message.metadata
        }
      })

    } catch (error) {
      console.error('Message logging error:', error)
    }
  }

  async endConversation(
    conversationId: string,
    metrics: ConversationMetrics
  ): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const { error } = await supabase
        .from('chatbot_conversations')
        .update({
          lead_id: metrics.leadId,
          lead_captured: metrics.leadCaptured,
          conversation_rating: metrics.conversationRating,
          exit_point: metrics.exitPoint,
          duration_seconds: metrics.duration,
          ended_at: new Date().toISOString(),
          conversation_summary: this.generateConversationSummary(metrics)
        })
        .eq('id', conversationId)

      if (error) {
        console.error('Failed to end conversation tracking:', error)
        return
      }

      // Track conversation end event
      await this.trackEvent({
        event_type: 'conversation_ended',
        session_id: metrics.sessionId,
        event_data: {
          conversationId,
          duration: metrics.duration,
          totalMessages: metrics.totalMessages,
          leadCaptured: metrics.leadCaptured,
          exitPoint: metrics.exitPoint,
          leadId: metrics.leadId
        }
      })

    } catch (error) {
      console.error('Conversation end error:', error)
    }
  }

  async trackLeadCapture(
    leadId: string,
    sessionId: string,
    conversationId?: string,
    source: string = 'chatbot'
  ): Promise<void> {
    try {
      await this.trackEvent({
        event_type: 'lead_captured',
        session_id: sessionId,
        lead_id: leadId,
        event_data: {
          conversationId,
          source,
          captureTime: new Date().toISOString()
        }
      })

      // Update conversation if provided
      if (conversationId) {
        const supabase = await this.getSupabaseClient()
        await supabase
          .from('chatbot_conversations')
          .update({
            lead_id: leadId,
            lead_captured: true
          })
          .eq('id', conversationId)
      }

    } catch (error) {
      console.error('Lead capture tracking error:', error)
    }
  }

  private generateConversationSummary(metrics: ConversationMetrics): string {
    const parts = [
      `${metrics.totalMessages} messages`,
      `${Math.round(metrics.duration / 60)} minutes`,
      `Topics: ${metrics.topicsDiscussed.join(', ') || 'general'}`,
      metrics.leadCaptured ? 'Lead captured' : 'No lead',
      `Exit: ${metrics.exitPoint || 'unknown'}`
    ]
    
    return parts.join(' | ')
  }

  // Client-side analytics (for browser usage)
  static trackClientEvent(
    eventType: string,
    eventData?: Record<string, any>,
    sessionId?: string
  ): void {
    if (typeof window === 'undefined') return

    // Send to analytics API endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId || 'anonymous'
      },
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.error('Client analytics error:', error)
    })
  }

  // Performance monitoring
  async getConversationMetrics(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      const supabase = await this.getSupabaseClient()
      
      const startDate = new Date()
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
      }

      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .gte('started_at', startDate.toISOString())

      if (error) {
        console.error('Failed to get conversation metrics:', error)
        return null
      }

      // Calculate metrics
      const totalConversations = data.length
      const leadsGenerated = data.filter((c: any) => c.lead_captured).length
      const avgDuration = data.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0) / totalConversations
      const avgMessages = data.reduce((sum: number, c: any) => sum + (c.total_messages || 0), 0) / totalConversations

      return {
        totalConversations,
        leadsGenerated,
        conversionRate: totalConversations > 0 ? (leadsGenerated / totalConversations) * 100 : 0,
        avgDuration: Math.round(avgDuration),
        avgMessages: Math.round(avgMessages),
        timeRange,
        periodStart: startDate.toISOString(),
        periodEnd: new Date().toISOString()
      }

    } catch (error) {
      console.error('Metrics calculation error:', error)
      return null
    }
  }
}

export const analytics = AnalyticsService.getInstance()
export default analytics