# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Renovation Advisor Platform (SnapQuote) is a Next.js 15 application that provides voice-to-quote functionality for contractors via WhatsApp integration. The platform uses AI to convert voice walkthroughs into professional PDF quotes in under 60 seconds.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI Layer**: OpenAI GPT-4 for quote generation
- **Messaging**: Twilio (WhatsApp Business API, SMS pending)
- **Deployment**: Vercel with Edge Runtime
- **Static Hosting**: Hostinger for landing pages

## Troubleshooting Protocol

### IMPORTANT: Before Attempting Any Troubleshooting
**ALWAYS check `agent-log-troubleshooting.md` FIRST to review:**
- History of previous fixes attempted
- Solutions that have already been tried
- Known issues and their resolutions
- Patterns of recurring problems

This prevents duplicate troubleshooting attempts and provides context for faster resolution.

## Key Development Commands

```bash
# Development
npm run dev         # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run type-check # Run TypeScript checking

# Database
# Run schemas in Supabase SQL Editor in this order:
# 1. contractor-mvp-schema.sql
# 2. quick-win-schema.sql
```

## Important Files to Reference

- `agent-log-troubleshooting.md`: **Check this BEFORE any troubleshooting** - contains history of all fixes
- `renovation-advisor-mvp-prd.md`: Product requirements with AI-First Platform Principles
- `database/contractor-mvp-schema.sql`: Core contractor tables and RLS policies
- `database/quick-win-schema.sql`: Quick Win demonstration tables
- `/hostinger-deploy/`: Static HTML files for landing pages

## Current Implementation Status

### Completed Features
- ✅ 2-field progressive signup (name + phone)
- ✅ WhatsApp-only verification (SMS pending Twilio approval)
- ✅ Generic branding for Quick Win motivation
- ✅ API endpoints for contractor signup and verification
- ✅ Health check endpoint for service monitoring
- ✅ CORS configuration for cross-origin requests

### Known Issues & Resolutions
- **Next.js 15 Parameter Typing**: API routes require `params: Promise<{ id: string }>` instead of direct access
- **Twilio SMS**: Virtual number pending approval (24-48 hours), using WhatsApp-only in interim
- **Database Ambiguity**: RLS policies require explicit table prefixes (e.g., `contractors.id` not just `id`)

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_NUMBER= # Pending approval

# OpenAI
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://renovation-advisor-ten.vercel.app
NODE_ENV=production
```

## API Endpoints

```
/api/contractors/signup     # POST - Create contractor account
/api/contractors/verify-phone # POST - Verify phone with code
/api/contractors/[id]/status # GET - Check verification status
/api/health                 # GET - Service health check
/api/test                   # GET - API connectivity test
```

## Deployment Process

1. **Code Changes**: Push to GitHub master branch
2. **Vercel**: Auto-deploys from GitHub
3. **Hostinger**: Manual upload of static HTML files from `/hostinger-deploy/`

## Testing Checklist

- [ ] Test signup form submission
- [ ] Verify WhatsApp message delivery
- [ ] Check verification code flow
- [ ] Confirm Quick Win quote generation
- [ ] Test progressive profile completion

## Performance Targets

- Signup to verification: < 10 seconds
- Quick Win quote generation: < 60 seconds
- Voice processing latency: < 4 seconds
- API response time: < 500ms

## Security Considerations

- All database tables use Row Level Security (RLS)
- SMS consent tracking for Twilio compliance
- Environment variables for all sensitive data
- CORS headers configured for production domains