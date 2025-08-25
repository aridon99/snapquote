# API Endpoints Documentation

> **Auto-Generated**: This document is maintained by an automated architecture tracking system.  
> **Last Updated**: 2025-08-18
> **API Version**: 1.0.0

## Overview

The Renovation Advisor Platform API is built using Next.js 14 App Router with Edge Runtime. All endpoints follow RESTful conventions and return JSON responses.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication via JWT tokens provided by Supabase Auth.

```http
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": [] // Optional validation errors
}
```

## Endpoints

### Authentication

#### `/api/auth/callback`
- **Method**: `GET`
- **Purpose**: Handle Supabase auth callback
- **Authentication**: None required
- **Parameters**: URL parameters from OAuth provider
- **Response**: Redirect to dashboard
- **Implementation**: `/app/auth/callback/route.ts`

---

### Analytics

#### `/api/analytics`
- **Method**: `POST`
- **Purpose**: Track user events and analytics
- **Authentication**: Session-based (optional)
- **Headers**: `X-Session-ID`
- **Body**:
  ```json
  {
    "event_type": "string",
    "event_data": "object",
    "session_id": "string",
    "lead_id": "string?"
  }
  ```
- **Response**: Analytics event confirmation
- **Implementation**: `/app/api/analytics/route.ts`

#### `/api/analytics/conversations`
- **Method**: `GET`
- **Purpose**: Retrieve conversation analytics
- **Authentication**: Required
- **Query Parameters**: 
  - `start_date`: ISO date string
  - `end_date`: ISO date string  
  - `limit`: Number (default: 100)
- **Response**: Conversation metrics and data
- **Implementation**: `/app/api/analytics/conversations/route.ts`

#### `/api/analytics/leads`
- **Method**: `GET`
- **Purpose**: Retrieve lead analytics
- **Authentication**: Required
- **Query Parameters**:
  - `status`: Lead status filter
  - `source`: Lead source filter
  - `date_range`: Date range filter
- **Response**: Lead metrics and conversion data
- **Implementation**: `/app/api/analytics/leads/route.ts`

---

### Chatbot System

#### `/api/chatbot`
- **Method**: `POST`
- **Purpose**: Process chatbot conversations with AI
- **Authentication**: Session-based
- **Headers**: `X-Session-ID`
- **Body**:
  ```json
  {
    "message": "string",
    "conversationHistory": "ChatMessage[]",
    "conversationId": "string?"
  }
  ```
- **Response**: AI response with metadata
- **Implementation**: `/app/api/chatbot/route.ts`
- **External Services**: OpenAI GPT-4o Mini

#### `/api/chatbot/lead`
- **Method**: `POST`
- **Purpose**: Capture leads from chatbot interactions
- **Authentication**: Session-based
- **Headers**: `X-Session-ID`
- **Body**:
  ```json
  {
    "name": "string",
    "phone": "string",
    "email": "string",
    "projectType": "string?",
    "notes": "string?",
    "sessionId": "string",
    "conversationId": "string?"
  }
  ```
- **Response**: Lead capture confirmation
- **Implementation**: `/app/api/chatbot/lead/route.ts`
- **External Services**: NotificationAPI

---

### Projects

#### `/api/projects`
- **Method**: `GET`, `POST`
- **Purpose**: Project CRUD operations
- **Authentication**: Required
- **GET**: Retrieve user's projects
- **POST**: Create new project
- **Body** (POST):
  ```json
  {
    "title": "string",
    "description": "string",
    "type": "string",
    "budget_min": "number",
    "budget_max": "number",
    "timeline": "string",
    "address": "object"
  }
  ```
- **Response**: Project data or list
- **Implementation**: `/app/api/projects/route.ts`

#### `/api/projects/[id]`
- **Methods**: `GET`, `PUT`, `DELETE`
- **Purpose**: Individual project operations
- **Authentication**: Required
- **Parameters**: `id` - Project UUID
- **Response**: Project data
- **Implementation**: `/app/api/projects/[id]/route.ts`

#### `/api/projects/[id]/contractors`
- **Method**: `GET`, `POST`
- **Purpose**: Manage project-contractor relationships
- **Authentication**: Required
- **Parameters**: `id` - Project UUID
- **Response**: Matched contractors for project
- **Implementation**: `/app/api/projects/[id]/contractors/route.ts`

#### `/api/projects/[id]/files`
- **Method**: `GET`, `POST`, `DELETE`
- **Purpose**: Project file management
- **Authentication**: Required
- **Parameters**: `id` - Project UUID
- **POST Body**: FormData with files
- **Response**: File upload confirmation
- **Implementation**: `/app/api/projects/[id]/files/route.ts`

#### `/api/projects/[id]/messages`
- **Method**: `GET`, `POST`
- **Purpose**: Project messaging system
- **Authentication**: Required
- **Parameters**: `id` - Project UUID
- **POST Body**:
  ```json
  {
    "content": "string",
    "recipient_id": "string",
    "message_type": "text|file|milestone"
  }
  ```
- **Response**: Message data
- **Implementation**: `/app/api/projects/[id]/messages/route.ts`

#### `/api/projects/[id]/milestones`
- **Method**: `GET`, `POST`
- **Purpose**: Project milestone management
- **Authentication**: Required
- **Parameters**: `id` - Project UUID
- **Response**: Milestone data
- **Implementation**: `/app/api/projects/[id]/milestones/route.ts`

#### `/api/projects/[id]/pdf`
- **Method**: `GET`
- **Purpose**: Generate project PDF reports
- **Authentication**: Required
- **Parameters**: `id` - Project UUID
- **Query Parameters**: `type` - PDF type (brief|report|invoice)
- **Response**: PDF file
- **Implementation**: `/app/api/projects/[id]/pdf/route.ts`

#### `/api/projects/pdf`
- **Method**: `POST`
- **Purpose**: Generate PDF from project data
- **Authentication**: Required
- **Body**: Project data for PDF generation
- **Response**: PDF file
- **Implementation**: `/app/api/projects/pdf/route.ts`

---

### Contractors

#### `/api/contractors/match`
- **Method**: `POST`
- **Purpose**: Match contractors to project requirements
- **Authentication**: Required
- **Body**:
  ```json
  {
    "project_type": "string",
    "location": "object",
    "budget_range": "object",
    "timeline": "string",
    "specialties": "string[]"
  }
  ```
- **Response**: Matched contractor list
- **Implementation**: `/app/api/contractors/match/route.ts`

---

### Notifications

#### `/api/notifications/email`
- **Method**: `POST`
- **Purpose**: Send email notifications
- **Authentication**: Required (Admin)
- **Body**:
  ```json
  {
    "to": "string",
    "subject": "string",
    "content": "string",
    "template": "string?"
  }
  ```
- **Response**: Email send confirmation
- **Implementation**: `/app/api/notifications/email/route.ts`

#### `/api/notifications/sms`
- **Method**: `POST`
- **Purpose**: Send SMS notifications
- **Authentication**: Required (Admin)
- **Body**:
  ```json
  {
    "to": "string",
    "message": "string"
  }
  ```
- **Response**: SMS send confirmation
- **Implementation**: `/app/api/notifications/sms/route.ts`

---

### Payments

#### `/api/payments/escrow`
- **Method**: `POST`
- **Purpose**: Set up escrow payment
- **Authentication**: Required
- **Body**:
  ```json
  {
    "project_id": "string",
    "amount": "number",
    "milestone_id": "string"
  }
  ```
- **Response**: Escrow setup confirmation
- **Implementation**: `/app/api/payments/escrow/route.ts`

#### `/api/payments/release`
- **Method**: `POST`
- **Purpose**: Release escrow payment
- **Authentication**: Required
- **Body**:
  ```json
  {
    "escrow_id": "string",
    "amount": "number"
  }
  ```
- **Response**: Payment release confirmation
- **Implementation**: `/app/api/payments/release/route.ts`

---

### Milestones

#### `/api/milestones/[id]`
- **Methods**: `GET`, `PUT`, `DELETE`
- **Purpose**: Individual milestone operations
- **Authentication**: Required
- **Parameters**: `id` - Milestone UUID
- **Response**: Milestone data
- **Implementation**: `/app/api/milestones/[id]/route.ts`

---

### Leads

#### `/api/leads`
- **Method**: `GET`, `POST`
- **Purpose**: Lead management
- **Authentication**: Required
- **GET**: Retrieve leads
- **POST**: Create new lead
- **Response**: Lead data
- **Implementation**: `/app/api/leads/route.ts`

---

### Chat (Alternative endpoint)

#### `/api/chat`
- **Method**: `POST`
- **Purpose**: Alternative chat endpoint
- **Authentication**: Session-based
- **Body**: Chat message data
- **Response**: Chat response
- **Implementation**: `/app/api/chat/route.ts`

---

### Webhooks

#### `/api/webhooks/stripe`
- **Method**: `POST`
- **Purpose**: Handle Stripe webhook events
- **Authentication**: Stripe signature verification
- **Body**: Stripe event data
- **Response**: Webhook acknowledgment
- **Implementation**: `/app/api/webhooks/stripe/route.ts`

#### `/api/webhooks/sendgrid`
- **Method**: `POST`
- **Purpose**: Handle SendGrid webhook events
- **Authentication**: SendGrid signature verification
- **Body**: SendGrid event data
- **Response**: Webhook acknowledgment
- **Implementation**: `/app/api/webhooks/sendgrid/`

#### `/api/webhooks/twilio`
- **Method**: `POST`
- **Purpose**: Handle Twilio webhook events
- **Authentication**: Twilio signature verification
- **Body**: Twilio event data
- **Response**: Webhook acknowledgment
- **Implementation**: `/app/api/webhooks/twilio/`

---

### Cron Jobs

#### `/api/cron/*`
- **Method**: `GET`, `POST`
- **Purpose**: Scheduled job endpoints
- **Authentication**: Cron job authentication
- **Response**: Job execution status
- **Implementation**: `/app/api/cron/`

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

## Rate Limiting

- **General API**: 100 requests per minute per IP
- **Chatbot API**: 50 requests per minute per session
- **File Upload**: 10 requests per minute per user

## Pagination

List endpoints support pagination:

```http
GET /api/projects?page=1&limit=20&sort=created_at&order=desc
```

**Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field
- `order`: Sort order (asc|desc)

## Environment Variables

Required environment variables for API functionality:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# NotificationAPI
NOTIFICATIONAPI_CLIENT_ID=
NOTIFICATIONAPI_CLIENT_SECRET=

# Admin contacts
ADMIN_EMAIL=
ADMIN_PHONE=
```

---

## Testing

### Test Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Analytics event
curl -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session" \
  -d '{"event_type": "test_event", "event_data": {}}'

# Chatbot test
curl -X POST http://localhost:3000/api/chatbot \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session" \
  -d '{"message": "Hello, I need help with a kitchen renovation"}'
```

---

*This document is automatically maintained and updated as new endpoints are added to the system.*