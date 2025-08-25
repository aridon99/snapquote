import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import analytics from '@/lib/services/analytics'
import { sendLeadNotifications } from '@/lib/services/notificationapi'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

let cachedFAQ: string | null = null
let cachedPrompt: string | null = null

async function loadFAQContent(): Promise<string> {
  if (cachedFAQ) return cachedFAQ
  
  try {
    const faqPath = path.join(process.cwd(), 'public/content/faq.md')
    cachedFAQ = fs.readFileSync(faqPath, 'utf-8')
    return cachedFAQ
  } catch (error) {
    console.error('Failed to load FAQ content:', error)
    return 'FAQ content unavailable'
  }
}

async function loadChatbotPrompt(): Promise<string> {
  if (cachedPrompt) return cachedPrompt
  
  try {
    const promptPath = path.join(process.cwd(), 'public/content/chatbot-prompt.md')
    cachedPrompt = fs.readFileSync(promptPath, 'utf-8')
    return cachedPrompt
  } catch (error) {
    console.error('Failed to load chatbot prompt:', error)
    return 'Chatbot instructions unavailable'
  }
}

function analyzeMessage(message: string): {
  category: string
  urgency: 'immediate' | 'planning' | 'exploring'
  leadQuality: 'high' | 'medium' | 'low'
  projectType?: string
} {
  const lowerMessage = message.toLowerCase()
  
  // Detect project type
  let projectType: string | undefined
  if (lowerMessage.includes('kitchen')) projectType = 'kitchen'
  else if (lowerMessage.includes('bathroom')) projectType = 'bathroom'
  else if (lowerMessage.includes('whole house') || lowerMessage.includes('full renovation')) projectType = 'whole_house'
  else if (lowerMessage.includes('addition') || lowerMessage.includes('extend')) projectType = 'addition'
  else if (lowerMessage.includes('basement')) projectType = 'basement'
  else if (lowerMessage.includes('roof')) projectType = 'roofing'
  else if (lowerMessage.includes('flooring') || lowerMessage.includes('floor')) projectType = 'flooring'
  
  // Detect urgency
  let urgency: 'immediate' | 'planning' | 'exploring' = 'exploring'
  if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('immediately')) {
    urgency = 'immediate'
  } else if (lowerMessage.includes('planning') || lowerMessage.includes('timeline') || lowerMessage.includes('when')) {
    urgency = 'planning'
  }
  
  // Detect lead quality
  let leadQuality: 'high' | 'medium' | 'low' = 'low'
  const highValueIndicators = ['budget', 'cost', 'price', 'quote', 'estimate', 'contractor', 'start', 'timeline']
  const mediumValueIndicators = ['how much', 'process', 'works', 'getting started']
  
  if (highValueIndicators.some(indicator => lowerMessage.includes(indicator))) {
    leadQuality = 'high'
  } else if (mediumValueIndicators.some(indicator => lowerMessage.includes(indicator))) {
    leadQuality = 'medium'
  }
  
  // Detect category
  let category = 'general'
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
    category = 'pricing'
  } else if (lowerMessage.includes('contractor') || lowerMessage.includes('vetting')) {
    category = 'contractors'
  } else if (lowerMessage.includes('process') || lowerMessage.includes('how it works')) {
    category = 'process'
  } else if (lowerMessage.includes('guarantee') || lowerMessage.includes('warranty')) {
    category = 'quality'
  }
  
  return { category, urgency, leadQuality, projectType }
}

function shouldRequestLeadCapture(analysis: any, messageCount: number): boolean {
  // Request lead capture after 3+ messages if high quality lead
  if (messageCount >= 3 && analysis.leadQuality === 'high') {
    return true
  }
  
  // Request lead capture after 5+ messages for medium quality leads
  if (messageCount >= 5 && analysis.leadQuality === 'medium') {
    return true
  }
  
  // Request lead capture immediately for urgent requests
  if (analysis.urgency === 'immediate') {
    return true
  }
  
  return false
}

function extractContactInfo(conversationHistory: any[]): {
  name?: string
  phone?: string
  email?: string
  hasAllInfo: boolean
} {
  let name: string | undefined
  let phone: string | undefined
  let email: string | undefined

  // Look through user messages for contact information
  for (const message of conversationHistory) {
    if (message.sender === 'user') {
      const content = message.content.toLowerCase()
      
      // Extract name (look for patterns like "my name is", "I'm", "call me")
      if (!name) {
        const namePatterns = [
          /(?:my name is|i'm|i am|call me|this is)\s+([a-zA-Z\s]{2,30})/i,
          /^([a-zA-Z\s]{2,30})(?:\s|$)/i // First word(s) if it looks like a name
        ]
        for (const pattern of namePatterns) {
          const match = message.content.match(pattern)
          if (match && match[1]) {
            const extractedName = match[1].trim()
            // Validate it looks like a name (not too long, has letters)
            if (extractedName.length >= 2 && extractedName.length <= 30 && /^[a-zA-Z\s]+$/.test(extractedName)) {
              name = extractedName
              break
            }
          }
        }
      }
      
      // Extract phone number
      if (!phone) {
        const phonePattern = /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/
        const phoneMatch = message.content.match(phonePattern)
        if (phoneMatch) {
          phone = phoneMatch[1].replace(/[-.\s\(\)]/g, '').replace(/^1/, '+1')
          if (!phone.startsWith('+1')) phone = '+1' + phone
        }
      }
      
      // Extract email
      if (!email) {
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
        const emailMatch = message.content.match(emailPattern)
        if (emailMatch) {
          email = emailMatch[1].toLowerCase()
        }
      }
    }
  }

  return {
    name,
    phone,
    email,
    hasAllInfo: !!(name && phone && email)
  }
}

export async function POST(request: NextRequest) {
  const sessionId = request.headers.get('x-session-id') || `session_${Date.now()}`
  let conversationId: string | null = null

  try {
    const { message, conversationHistory, conversationId: existingConversationId } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const [faqContent, chatbotPrompt] = await Promise.all([
      loadFAQContent(),
      loadChatbotPrompt()
    ])

    // Analyze the user's message
    const analysis = analyzeMessage(message)
    const messageCount = conversationHistory?.length || 0
    const shouldCapture = shouldRequestLeadCapture(analysis, messageCount)

    // Check if we have collected contact information naturally
    const fullConversationHistory = [...(conversationHistory || []), { sender: 'user', content: message }]
    const contactInfo = extractContactInfo(fullConversationHistory)
    const shouldSendNotification = contactInfo.hasAllInfo

    // Start or get conversation tracking
    if (!existingConversationId && messageCount === 0) {
      conversationId = await analytics.startConversation(sessionId)
    } else {
      conversationId = existingConversationId || sessionId
    }

    // Build conversation context
    const conversationContext = conversationHistory
      ?.slice(-10) // Keep last 10 messages for context
      ?.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })) || []

    const systemPrompt = `${chatbotPrompt}

KNOWLEDGE BASE:
${faqContent}

CONVERSATION ANALYSIS:
- Current message category: ${analysis.category}
- User urgency: ${analysis.urgency}
- Lead quality: ${analysis.leadQuality}
- Project type: ${analysis.projectType || 'unknown'}
- Message count: ${messageCount}
- Should request lead capture: ${shouldCapture}

INSTRUCTIONS:
1. You are Emma, RenovationAdvisor's renovation assistant
2. ONLY use information from the provided FAQ knowledge base
3. Be warm, professional, and helpful
4. Keep responses concise (2-3 sentences max)
5. Always end with a follow-up question to keep conversation flowing
6. If asked about topics not in the FAQ, offer to connect them with an expert
7. NEVER mention intake forms, online forms, or filling out forms - always offer direct contact collection
8. ${shouldCapture ? 'At the end of your response, suggest connecting them with a renovation advisor for personalized guidance.' : 'Focus on being helpful and educational.'}

Current user message: "${message}"`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationContext,
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    let responseMessage = completion.choices[0]?.message?.content || 
      "I apologize, but I'm having a technical moment. While I sort this out, you can call us directly at (555) 123-4567 or submit our intake form on the website."

    // If we just collected all contact information, send notification and update response
    if (shouldSendNotification && contactInfo.name && contactInfo.phone && contactInfo.email) {
      try {
        // Determine project type from conversation
        const projectType = analysis.projectType || fullConversationHistory.reduce((type, msg) => {
          if (msg.sender === 'user') {
            const lowerContent = msg.content.toLowerCase()
            if (lowerContent.includes('kitchen')) return 'kitchen'
            if (lowerContent.includes('bathroom')) return 'bathroom'
            if (lowerContent.includes('basement')) return 'basement'
            if (lowerContent.includes('addition')) return 'addition'
            if (lowerContent.includes('whole house')) return 'whole house'
          }
          return type
        }, 'renovation')

        // Send lead notification
        await sendLeadNotifications({
          name: contactInfo.name,
          phone: contactInfo.phone,
          email: contactInfo.email,
          projectType,
          notes: `Natural conversation lead capture via Emma chatbot. Project: ${projectType}`
        })

        // Update response to acknowledge lead capture
        responseMessage = `Perfect! I've shared your information with our team. One of our renovation advisors will reach out within 24 hours to discuss your ${projectType} project. In the meantime, feel free to ask me any other questions. We're excited to help transform your space!`
        
      } catch (error) {
        console.error('Failed to send lead notification:', error)
        // Don't change the response if notification fails
      }
    }

    // Log user message
    if (conversationId) {
      await analytics.logMessage(
        conversationId,
        {
          id: `user_${Date.now()}`,
          content: message,
          sender: 'user',
          metadata: analysis
        },
        sessionId
      )

      // Log bot response
      await analytics.logMessage(
        conversationId,
        {
          id: `bot_${Date.now()}`,
          content: responseMessage,
          sender: 'bot',
          metadata: {
            shouldCapture,
            tokens: completion.usage?.total_tokens
          }
        },
        sessionId
      )
    }

    // Track analytics event
    await analytics.trackEvent({
      event_type: 'chatbot_message_exchange',
      event_data: {
        conversationId,
        messageCount: messageCount + 1,
        category: analysis.category,
        urgency: analysis.urgency,
        leadQuality: analysis.leadQuality,
        projectType: analysis.projectType,
        shouldCapture,
        responseLength: responseMessage.length
      },
      session_id: sessionId,
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      message: responseMessage,
      conversationId,
      metadata: {
        category: analysis.category,
        urgency: analysis.urgency,
        leadQuality: analysis.leadQuality,
        projectType: analysis.projectType,
        action: shouldCapture ? 'request_lead_capture' : undefined,
        contactInfo: {
          hasName: !!contactInfo.name,
          hasPhone: !!contactInfo.phone,
          hasEmail: !!contactInfo.email,
          isComplete: contactInfo.hasAllInfo
        },
        leadCaptured: shouldSendNotification
      }
    })

  } catch (error) {
    console.error('Chatbot API error:', error)
    
    return NextResponse.json({
      message: "I apologize, but I'm having a technical moment. While I sort this out, you can call us directly at (555) 123-4567 or submit our intake form on the website.",
      metadata: {
        category: 'error',
        urgency: 'exploring',
        leadQuality: 'low'
      }
    }, { status: 200 }) // Return 200 to avoid client-side errors
  }
}