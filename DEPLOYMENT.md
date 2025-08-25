# RenovationAdvisor - Vercel Deployment Guide

## Quick Deploy to Vercel (15 minutes)

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase project with required tables
- Environment variables ready

### Step 1: Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Frenovation-advisor)

**OR Manual Deployment:**

1. **Connect GitHub Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select "renovation-advisor" folder

2. **Configure Build Settings**
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Install Command: `npm install` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Deploy**
   - Click "Deploy"
   - Wait ~1 minute for build to complete

### Step 2: Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Required - Application URL
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app

# Required - OpenAI (for voice processing)
OPENAI_API_KEY=your_openai_api_key

# Required - Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886

# Optional - NotificationAPI
NOTIFICATIONAPI_CLIENT_ID=your_client_id
NOTIFICATIONAPI_CLIENT_SECRET=your_client_secret

# Optional - Feature Flags
USE_MOCK_GPT=false

# Admin Contact
ADMIN_EMAIL=your_admin_email
ADMIN_PHONE=your_admin_phone
```

### Step 3: Database Setup

Ensure your Supabase database has these schemas:
- Run `database/contractor-pricing-schema.sql` 
- Run `database/quote-system-schema.sql`
- Run `database/test-validation-schema.sql`

### Step 4: Test Phone-First Journey

1. **Mobile Browser Test**
   - Visit your Vercel URL on mobile
   - Test contractor signup flow
   - Verify WhatsApp verification works

2. **Contractor Journey**
   - Sign up as contractor with phone number
   - Complete verification process
   - Access mobile-optimized dashboard
   - Switch to WhatsApp for quote workflow

## Mobile Optimization Features

✅ **Progressive Web App (PWA)**
- Install prompt on mobile browsers
- Offline functionality
- Native-like app experience

✅ **Mobile-First Design**
- Touch-friendly buttons (44px minimum)
- Optimized forms for mobile keyboards
- Responsive layouts for small screens

✅ **Voice Input Optimized**
- Microphone permissions handling
- Audio recording for consultations
- Voice command processing

✅ **WhatsApp Integration**
- Webhook endpoints configured
- PDF delivery via WhatsApp
- Voice message transcription

## Performance Optimizations

- **Image optimization** with Next.js Image component
- **Code splitting** for faster page loads
- **Compression** enabled for smaller bundle sizes
- **CDN** via Vercel's global network
- **Edge functions** for low-latency API responses

## Monitoring & Analytics

- **Vercel Analytics** automatically enabled
- **Real User Monitoring** for performance tracking
- **Error tracking** via Vercel dashboard
- **Build time optimization** tracking

## Cost Optimization

**Free Tier Limits:**
- 100GB bandwidth/month
- 6000 build minutes/month  
- Unlimited personal projects
- Global CDN included

**Scaling Strategy:**
- Monitor usage in Vercel dashboard
- Upgrade to Pro ($20/month) when needed
- Optimize bundle size for cost efficiency

## Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project → Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Update WhatsApp Webhooks**
   - Update webhook URLs in Twilio console
   - Point to your custom domain

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure Node.js version compatibility

### API Timeouts  
- Serverless functions have 10s limit on free tier
- Optimize long-running operations
- Consider background job processing

### Mobile Issues
- Test on actual mobile devices
- Check viewport meta tags
- Verify touch targets are large enough

### WhatsApp Webhooks
- Verify webhook URLs are accessible
- Check Twilio webhook configuration
- Test with ngrok for local development

## Support

For deployment issues:
- Check Vercel documentation
- Review build logs
- Test locally first with `npm run build && npm start`

For application issues:
- Check Supabase logs
- Verify API keys and permissions
- Test individual API endpoints