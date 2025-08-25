# Renovation Advisor Platform - System Architecture

> **Auto-Generated**: This document is maintained by an automated architecture tracking system.  
> **Last Updated**: 2025-08-18
> **Version**: 1.0.0

## Overview

The Renovation Advisor Platform is a Next.js 14 SaaS application that connects homeowners with vetted contractors through an intelligent matching system, providing end-to-end project management with real-time communication, budget tracking, and automated workflows.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   Next.js 14    │◄──►│   App Router    │◄──►│   Supabase      │
│   (React + TS)  │    │   Edge Runtime  │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │   Integrations  │    │   Real-time     │
│   Tailwind CSS  │    │   Notifications │    │   Subscriptions │
│   Radix UI      │    │   File Storage  │    │   Row Security  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## System Components

### 1. Frontend Layer (Next.js 14)

**Architecture Pattern**: App Router with Server/Client Components
**Location**: `/app/`, `/components/`

#### Core Features:
- **Authentication**: Supabase Auth integration
- **Real-time Updates**: WebSocket connections via Supabase Realtime
- **File Uploads**: Direct uploads to Supabase Storage
- **State Management**: React Query for server state, React state for local
- **Routing**: File-based routing with App Router

#### Key Directories:
```
app/
├── (auth)/              # Authentication routes
├── (dashboard)/         # Protected dashboard routes  
├── api/                 # API routes (Edge Runtime)
├── intake/              # Project intake form
├── dashboard/           # Main dashboard
└── contractors/         # Contractor search
```

### 2. Backend API Layer (Edge Runtime)

**Architecture Pattern**: RESTful API with Edge Functions
**Location**: `/app/api/`

#### API Structure:
```
api/
├── auth/               # Authentication endpoints
├── projects/           # Project CRUD operations
│   ├── [id]/          # Project-specific operations
│   └── pdf/           # PDF generation
├── contractors/        # Contractor management
├── chatbot/           # AI chatbot integration
├── analytics/         # Usage analytics
├── notifications/     # Email/SMS services
├── payments/          # Payment processing
└── webhooks/          # External service webhooks
```

#### Integration Services:
- **OpenAI GPT-4o Mini**: Chatbot intelligence
- **NotificationAPI**: Email/SMS notifications
- **Supabase**: Database operations
- **PDF Generation**: React PDF for documents

### 3. Database Layer (Supabase)

**Architecture Pattern**: PostgreSQL with Row Level Security
**Location**: `/database/`

#### Core Tables:
```sql
profiles          # User management (extends auth.users)
├── contractors   # Contractor database
├── projects      # Project information
├── messages      # Real-time communication
├── budget_items  # Expense tracking
├── project_files # File storage references
├── intake_forms  # Project intake data
└── analytics     # Usage tracking
```

#### Security Model:
- **Row Level Security (RLS)**: Enabled on all tables
- **Policy-based Access**: Users can only access their own data
- **Audit Logging**: All operations tracked
- **Real-time Subscriptions**: WebSocket connections

### 4. Real-time Communication

**Architecture Pattern**: WebSocket-based messaging
**Implementation**: Supabase Realtime

#### Features:
- **Live Chat**: Instant messaging between homeowners and contractors
- **Notifications**: Real-time updates for project changes
- **Presence**: Online status tracking
- **File Sharing**: Real-time file upload notifications

### 5. AI/Chatbot System

**Architecture Pattern**: Conversational AI with Lead Capture
**Location**: `/components/chatbot/`, `/app/api/chatbot/`

#### Components:
- **Emma AI Assistant**: GPT-4o Mini powered chatbot
- **Knowledge Base**: FAQ content for contextual responses
- **Lead Capture**: Automatic contact information collection
- **Analytics**: Conversation tracking and lead scoring

#### Data Flow:
```
User Message → ChatbotWidget → API Route → OpenAI → Response + Lead Analysis
     ↓              ↓             ↓          ↓           ↓
Analytics     Message History   Context   AI Response  Lead Capture
```

## Data Flow Patterns

### 1. Project Intake Flow
```
Intake Form → Validation → Project Creation → Contractor Matching → Notifications
     ↓            ↓             ↓                 ↓               ↓
  File Upload  Schema Check  Database Insert  Algorithm Run   Email/SMS
```

### 2. Real-time Messaging Flow
```
User Types → WebSocket → Supabase → Real-time → Other Clients
     ↓           ↓           ↓          ↓           ↓
  Validation  Message Save  Broadcast  Update UI  Notifications
```

### 3. Chatbot Lead Flow
```
Chat Input → AI Processing → Lead Detection → Contact Capture → Notifications
     ↓            ↓              ↓              ↓              ↓
  Context    OpenAI API    Scoring Logic   Form Display   Admin Alert
```

## Technology Stack

### Core Technologies
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI primitives
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

### External Integrations
- **AI**: OpenAI GPT-4o Mini
- **Notifications**: NotificationAPI (Email + SMS)
- **PDF Generation**: React PDF
- **Analytics**: Custom implementation with Supabase

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Testing**: Playwright (E2E)
- **Deployment**: Vercel

## Security Architecture

### Authentication & Authorization
- **Provider**: Supabase Auth
- **Method**: JWT tokens with secure httpOnly cookies
- **Session Management**: Automatic refresh with sliding expiration
- **Route Protection**: Middleware-based auth checking

### Data Security
- **Encryption**: All data encrypted at rest and in transit
- **API Security**: Rate limiting, input validation, CORS
- **File Security**: Signed URLs, access controls
- **Database Security**: RLS policies, prepared statements

### Privacy & Compliance
- **Data Retention**: Configurable retention policies
- **User Rights**: GDPR-compliant data access/deletion
- **Audit Trail**: Complete operation logging
- **PII Protection**: Minimal data collection, secure storage

## Performance Architecture

### Frontend Optimization
- **Code Splitting**: Route-based code splitting
- **Image Optimization**: Next.js automatic optimization
- **Caching**: React Query for client-side caching
- **Bundle Size**: Tree shaking, dynamic imports

### Backend Optimization
- **Edge Runtime**: Global distribution via Vercel Edge
- **Database**: Connection pooling, query optimization
- **Real-time**: Efficient WebSocket connections
- **API Response**: JSON optimization, compression

### Scalability Considerations
- **Horizontal Scaling**: Serverless architecture
- **Database Scaling**: Supabase auto-scaling
- **CDN**: Global content distribution
- **Monitoring**: Performance tracking and alerts

## Deployment Architecture

### Production Environment
- **Hosting**: Vercel (Edge Network)
- **Database**: Supabase (Global Infrastructure)
- **Monitoring**: Built-in Vercel Analytics
- **CI/CD**: GitHub → Vercel automatic deployment

### Environment Configuration
- **Development**: Local Next.js dev server + Supabase
- **Staging**: Preview deployments on Vercel
- **Production**: Multi-region deployment with CDN

## File Organization

### Component Architecture
```
components/
├── ui/              # Reusable UI primitives (Button, Input, etc.)
├── forms/           # Form components (IntakeForm, etc.)
├── projects/        # Project-specific components
├── contractors/     # Contractor-related components
├── chatbot/         # AI chatbot system
├── dashboard/       # Dashboard components
└── providers/       # Context providers
```

### Service Layer
```
lib/
├── supabase/        # Database client and utilities
├── services/        # Business logic services
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── providers/       # React Query and other providers
```

## API Design Patterns

### RESTful Conventions
- **GET**: Data retrieval
- **POST**: Resource creation
- **PUT/PATCH**: Resource updates  
- **DELETE**: Resource removal

### Response Patterns
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  details?: ValidationError[]
}
```

### Authentication Pattern
- **Header**: `Authorization: Bearer <jwt_token>`
- **Middleware**: Automatic token validation
- **Context**: User context injection

## Future Architecture Considerations

### Planned Enhancements
- **Microservices**: Potential service decomposition
- **Event Sourcing**: Audit trail improvements
- **Machine Learning**: Enhanced matching algorithms
- **Mobile Apps**: React Native integration
- **Blockchain**: Smart contract integration

### Scalability Roadmap
- **Multi-tenancy**: Enterprise customer support
- **Regional Deployment**: Geographic data residency
- **Advanced Analytics**: Business intelligence platform
- **Third-party Ecosystem**: Plugin architecture

---

## Architecture Metrics

### Current System Stats
- **Components**: ~18 React components
- **API Endpoints**: ~32 routes
- **Database Tables**: ~8 core tables
- **External Services**: ~126 integrations
- **Pages**: ~10 user-facing pages

### Performance Targets
- **Page Load**: < 2 seconds
- **API Response**: < 500ms (95th percentile)
- **Real-time Latency**: < 100ms
- **Uptime**: 99.9%

---

*This document is automatically maintained and updated as the system evolves.*