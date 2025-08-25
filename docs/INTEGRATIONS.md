# Third-Party Integrations Documentation

> **Auto-Generated**: This document is maintained by an automated architecture tracking system.  
> **Last Updated**: 2025-08-18
> **Integration Count**: 5 active services

## Overview

The Renovation Advisor Platform integrates with several third-party services to provide comprehensive functionality including database management, authentication, AI capabilities, notifications, and payment processing.

## Integration Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   External      │
│   Next.js       │◄──►│   Edge Runtime  │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   Service Integrations  │
                    │                         │
                    │  ┌─ Supabase           │
                    │  ├─ OpenAI             │
                    │  ├─ NotificationAPI    │
                    │  ├─ Vercel (Hosting)   │
                    │  └─ Future: Stripe     │
                    └─────────────────────────┘
```

## Core Integrations

### 1. Supabase (Database & Infrastructure)

**Purpose**: Primary backend-as-a-service providing database, authentication, storage, and real-time capabilities.

**Services Used**:
- PostgreSQL Database
- Authentication (JWT-based)
- Real-time subscriptions
- File storage
- Row Level Security (RLS)

**Configuration**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ultqnpgkdtzdmrbybkhj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Implementation Files**:
- `/lib/supabase/client.ts` - Client-side Supabase instance
- `/lib/supabase/server.ts` - Server-side Supabase instance
- `/lib/supabase/database.ts` - Database utilities and types
- `/middleware.ts` - Authentication middleware

**Key Features**:
- **Authentication**: Email/password, OAuth providers
- **Database**: 8+ tables with relationships and constraints
- **Real-time**: WebSocket connections for live updates
- **Storage**: File uploads with signed URLs
- **Security**: RLS policies for data protection

**API Usage**:
```typescript
// Client-side usage
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

// Real-time subscription
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    console.log('New message:', payload)
  })
  .subscribe()
```

**Database Schema**:
- Tables: `profiles`, `projects`, `contractors`, `messages`, `budget_items`, `project_files`, `intake_forms`, `analytics`
- Relationships: Foreign keys with cascading deletes
- Triggers: Automated timestamps and notifications

---

### 2. OpenAI (Artificial Intelligence)

**Purpose**: Powers the Emma AI chatbot with natural language processing and conversational capabilities.

**Services Used**:
- GPT-4o Mini model
- Chat completions API
- Token usage tracking

**Configuration**:
```env
OPENAI_API_KEY=sk-proj-qgrN5TT_X4LROBRfKmNHZ395lb3HGlAsN1eXsKSIUMnXkfu5lKfIh6D_Q-Aop4pRGyISaW9wE
```

**Implementation Files**:
- `/lib/openai.ts` - OpenAI client configuration
- `/app/api/chatbot/route.ts` - Main chatbot API endpoint
- `/public/content/chatbot-prompt.md` - AI assistant instructions
- `/public/content/faq.md` - Knowledge base content

**Key Features**:
- **Conversational AI**: Natural language understanding
- **Context Awareness**: Maintains conversation history
- **Lead Detection**: Analyzes user intent for lead capture
- **Knowledge Base**: FAQ-driven responses
- **Session Management**: Conversation persistence

**API Usage**:
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ],
  max_tokens: 300,
  temperature: 0.7,
})
```

**Cost Management**:
- Token limits per request (300 tokens)
- Request rate limiting (50/minute per session)
- Usage monitoring and analytics
- Optimized prompts for efficiency

---

### 3. NotificationAPI (Communications)

**Purpose**: Unified notification service for both email and SMS communications.

**Services Used**:
- SMS notifications
- Email notifications (planned)
- Template management
- Delivery tracking

**Configuration**:
```env
NOTIFICATIONAPI_CLIENT_ID=g1d8uh5v2z7olysvuctoym6z6k
NOTIFICATIONAPI_CLIENT_SECRET=2j24le4kpidddtxx1tvzks81rxlw2ds6qt4nka7bsd217mpp5fqkzsyqgq
ADMIN_PHONE=+16506425223
ADMIN_EMAIL=admin@renovationadvisor.com
```

**Implementation Files**:
- `/app/api/chatbot/lead/route.ts` - Lead notification integration
- `/app/api/notifications/` - General notification endpoints
- Package: `notificationapi-node-server-sdk`

**Key Features**:
- **SMS Alerts**: Instant lead notifications
- **Template System**: Pre-configured message templates
- **Multi-channel**: Single API for email and SMS
- **Delivery Tracking**: Success/failure monitoring
- **Global Reach**: International SMS support

**API Usage**:
```typescript
import notificationapi from 'notificationapi-node-server-sdk'

notificationapi.init(
  process.env.NOTIFICATIONAPI_CLIENT_ID!,
  process.env.NOTIFICATIONAPI_CLIENT_SECRET!
)

await notificationapi.send({
  type: 'inquary_txt',
  to: {
    number: adminPhone
  },
  parameters: {
    comment: `New lead: ${name} (${phone}) - ${projectType}`
  }
})
```

**Message Templates**:
- `inquary_txt`: Lead notification template
- Future: Email templates for various notifications

---

### 4. Vercel (Hosting & Deployment)

**Purpose**: Frontend hosting, serverless functions, and global CDN for the Next.js application.

**Services Used**:
- Static site hosting
- Serverless functions (Edge Runtime)
- Global CDN
- Automatic deployments
- Performance monitoring

**Configuration**:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# Production URL set automatically by Vercel
```

**Key Features**:
- **Edge Runtime**: Global function execution
- **Automatic Deployments**: GitHub integration
- **Performance**: Built-in optimization
- **Monitoring**: Real-time analytics
- **SSL**: Automatic HTTPS certificates

**Deployment Configuration**:
```json
// vercel.json (if needed)
{
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "edge"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

---

### 5. Future Integrations (Planned)

#### Stripe (Payments)
**Purpose**: Payment processing for project fees and escrow services.

**Planned Configuration**:
```env
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**Implementation Plan**:
- Escrow payment system
- Subscription billing
- Webhook handling
- Payment method management

#### Google Maps API (Location Services)
**Purpose**: Address validation and contractor location matching.

**Planned Features**:
- Address autocomplete
- Distance calculations
- Service area mapping
- Location validation

#### Twilio (Communications - Alternative)
**Purpose**: Alternative SMS provider if needed.

**Would Replace**: NotificationAPI SMS functionality if requirements change.

---

## Integration Patterns

### 1. API Client Pattern
```typescript
// Common pattern for external API clients
class ExternalServiceClient {
  private client: ExternalSDK
  
  constructor(config: ServiceConfig) {
    this.client = new ExternalSDK(config)
  }
  
  async sendRequest(data: RequestData): Promise<Response> {
    try {
      const result = await this.client.request(data)
      return { success: true, data: result }
    } catch (error) {
      console.error('Service error:', error)
      return { success: false, error: error.message }
    }
  }
}
```

### 2. Environment Variable Management
```typescript
// Validation pattern for required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'OPENAI_API_KEY',
  'NOTIFICATIONAPI_CLIENT_ID'
]

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
})
```

### 3. Error Handling Pattern
```typescript
// Consistent error handling across integrations
async function handleExternalRequest<T>(
  request: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await request()
    return { success: true, data }
  } catch (error) {
    console.error('External service error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

## Security Considerations

### API Key Management
- **Environment Variables**: All keys stored in environment variables
- **Key Rotation**: Regular key rotation schedule
- **Access Restriction**: Minimal required permissions
- **Monitoring**: Usage tracking and anomaly detection

### Data Privacy
- **Data Minimization**: Only necessary data shared with external services
- **Encryption**: All data encrypted in transit
- **Compliance**: GDPR and privacy law compliance
- **Audit Trails**: Complete logging of external service calls

### Rate Limiting
- **OpenAI**: 50 requests/minute per session
- **NotificationAPI**: Standard rate limits
- **Supabase**: Connection pooling and query optimization
- **Error Handling**: Graceful degradation on rate limit hits

## Monitoring & Observability

### Logging
```typescript
// Structured logging for integrations
import { createLogger } from '@/lib/logger'

const logger = createLogger('integrations')

logger.info('External service call', {
  service: 'openai',
  endpoint: 'chat/completions',
  duration: 1234,
  tokens: 150
})
```

### Health Checks
```typescript
// Health check endpoints for external services
export async function checkServiceHealth(service: string): Promise<boolean> {
  try {
    switch (service) {
      case 'supabase':
        return await checkSupabaseHealth()
      case 'openai':
        return await checkOpenAIHealth()
      default:
        return false
    }
  } catch {
    return false
  }
}
```

### Performance Monitoring
- Response time tracking
- Error rate monitoring
- Usage analytics
- Cost tracking (especially for OpenAI)

## Development vs Production

### Environment Differences
```typescript
const config = {
  development: {
    supabase: 'local-instance',
    openai: 'test-key-with-limits',
    notifications: 'sandbox-mode'
  },
  production: {
    supabase: 'production-instance',
    openai: 'production-key',
    notifications: 'live-mode'
  }
}
```

### Testing Strategies
- **Mocking**: External service mocking for unit tests
- **Staging**: Separate staging environment for integration testing
- **Feature Flags**: Gradual rollout of new integrations

## Cost Management

### Current Costs (Estimated Monthly)
- **Supabase**: $25-50 (Pro plan)
- **OpenAI**: $20-100 (based on usage)
- **NotificationAPI**: $10-30 (based on volume)
- **Vercel**: $20-50 (Pro plan)

### Optimization Strategies
- **Caching**: Reduce API calls through intelligent caching
- **Batching**: Batch operations where possible
- **Monitoring**: Real-time cost tracking
- **Limits**: Usage limits and alerts

---

## Integration Roadmap

### Phase 1 (Current)
- ✅ Supabase integration complete
- ✅ OpenAI chatbot integration
- ✅ NotificationAPI for lead alerts
- ✅ Vercel hosting and deployment

### Phase 2 (Next 3 months)
- 🔄 Stripe payment integration
- 🔄 Enhanced analytics with external providers
- 🔄 Google Maps API for location services
- 🔄 Advanced notification templates

### Phase 3 (6+ months)
- 📅 CRM integration (HubSpot/Salesforce)
- 📅 Advanced AI features (image analysis)
- 📅 Mobile push notifications
- 📅 Third-party contractor marketplace APIs

---

*This document is automatically maintained and updated as new integrations are added to the system.*