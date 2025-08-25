# Testing the Voice Quote Review System

## Prerequisites

### 1. Database Setup
Run the following SQL in your Supabase SQL editor:
```sql
-- Run the quote system schema
-- File: database/quote-system-schema.sql
```

### 2. Environment Variables
Add these to your `.env.local`:
```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886  # Twilio sandbox number

# OpenAI (for production)
OPENAI_API_KEY=your_openai_api_key

# Mock mode for testing without GPT
USE_MOCK_GPT=true
```

### 3. Create Supabase Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `documents`
3. Make it public for testing (PDFs need to be accessible)

## Testing Flow

### Step 1: Create Test Contractor Account

1. Sign up as a contractor at `/signup`:
   - Email: `test.plumber@example.com`
   - Password: `testpass123`
   - Role: Contractor
   - Trade: Plumber
   - Phone: `+14155551234` (your test phone)

2. Or use SQL to create test data:
```sql
-- Insert test contractor
INSERT INTO contractors (
  email, business_name, contact_name, phone, trade, whatsapp_verified
) VALUES (
  'test.plumber@example.com',
  'Test Plumbing Services',
  'Test Plumber',
  '+14155551234',
  'plumber',
  true
);

-- Insert test template
INSERT INTO quote_templates (
  contractor_id,
  business_name,
  business_phone,
  business_email,
  business_address,
  license_number
) SELECT 
  id,
  'Test Plumbing Services',
  '+14155551234',
  'test@plumbing.com',
  '123 Test St, San Francisco, CA',
  'LIC123456'
FROM contractors 
WHERE email = 'test.plumber@example.com';
```

### Step 2: Test Quote Generation API

Use curl or Postman to test quote generation:

```bash
curl -X POST http://localhost:3000/api/quotes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "contractorId": "YOUR_CONTRACTOR_ID",
    "customerName": "John Smith",
    "customerPhone": "+14155551234",
    "customerAddress": "123 Main St, San Francisco, CA",
    "projectDescription": "Bathroom renovation",
    "items": [
      {
        "description": "Toilet Installation",
        "quantity": 1,
        "unit": "each",
        "unit_price": 450,
        "category": "fixtures"
      },
      {
        "description": "Faucet Replacement",
        "quantity": 1,
        "unit": "each",
        "unit_price": 125,
        "category": "fixtures"
      }
    ],
    "whatsappThreadId": "14155551234"
  }'
```

### Step 3: Test WhatsApp Integration

#### Option A: Using Twilio Sandbox (Recommended for Testing)

1. Set up Twilio WhatsApp Sandbox:
   - Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join sandbox (send "join [sandbox-name]" to +1 415 523 8886)
   - Configure webhook URL: `https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp-quote`

2. Use ngrok to expose local server:
```bash
ngrok http 3000
```

3. Update Twilio sandbox webhook to your ngrok URL

#### Option B: Mock Testing Without Twilio

Use this curl command to simulate WhatsApp messages:

```bash
# Simulate voice message with edit commands
curl -X POST http://localhost:3000/api/webhooks/whatsapp-quote \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+14155551234&Body=&RecordingUrl=mock-audio.mp3"

# Simulate confirmation
curl -X POST http://localhost:3000/api/webhooks/whatsapp-quote \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+14155551234&Body=👍"
```

### Step 4: Test Voice Edit Commands

The system understands these voice commands (in mock mode):

1. **Price Changes**:
   - "Change the toilet to 650"
   - "Make the faucet 175 dollars"

2. **Adding Items**:
   - "Add a wax ring for 25 dollars"
   - "Add shut-off valve for 85"

3. **Removing Items**:
   - "Remove the second bathroom"
   - "Take out the vanity"

4. **Bulk Changes**:
   - "Add 10 percent to everything"
   - "Add 15% for rush job"

5. **Finalizing**:
   - "Send it"
   - "Looks good"
   - "Perfect, send to customer"

### Step 5: Test the Complete Flow

1. **Generate Initial Quote**:
   - Call `/api/quotes/generate` with test data
   - Note the quote ID returned

2. **Simulate WhatsApp Review**:
   - Send mock WhatsApp message to start review
   - System responds with PDF

3. **Make Voice Edits**:
   - Send voice message: "Change toilet to 650, add wax ring for 25"
   - System responds with confirmation text

4. **Confirm Changes**:
   - Reply with "👍"
   - System generates new PDF

5. **Finalize Quote**:
   - Send voice: "Perfect, send it"
   - System marks quote as sent

## Monitoring & Debugging

### Check Database Tables

```sql
-- View quotes
SELECT * FROM quotes ORDER BY created_at DESC;

-- View quote items
SELECT * FROM quote_items WHERE quote_id = 'YOUR_QUOTE_ID';

-- View edit history
SELECT * FROM quote_edits WHERE quote_id = 'YOUR_QUOTE_ID';

-- View review sessions
SELECT * FROM quote_review_sessions ORDER BY created_at DESC;

-- View webhook events (if logging enabled)
SELECT * FROM twilio_webhook_events ORDER BY created_at DESC;
```

### Check Logs

```bash
# Development server logs
npm run dev

# Check Supabase logs
# Go to Supabase Dashboard → Database → Logs
```

### Common Issues & Solutions

1. **PDF not generating**:
   - Check Supabase Storage bucket exists and is public
   - Verify PDFKit is installed: `npm list pdfkit`
   - Check console for PDF generation errors

2. **WhatsApp not responding**:
   - Verify Twilio credentials in `.env.local`
   - Check ngrok is running and URL is updated in Twilio
   - Look for webhook errors in console

3. **Voice commands not understood**:
   - Check `USE_MOCK_GPT=true` for testing
   - Review mock command patterns in `/api/quotes/edit/route.ts`
   - Try simpler commands like "change toilet to 500"

4. **Database errors**:
   - Ensure all tables are created (run schema SQL)
   - Check Supabase service role key is set
   - Verify RLS policies aren't blocking access

## Testing Without External Services

For local testing without Twilio/WhatsApp:

1. Use the mock endpoints directly
2. View generated PDFs in Supabase Storage
3. Check database for state changes
4. Use Postman/curl to simulate the flow

## Example Test Scenario

```javascript
// Test script for the complete flow
async function testQuoteFlow() {
  // 1. Generate quote
  const quoteResponse = await fetch('/api/quotes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractorId: 'test-contractor-id',
      customerName: 'Test Customer',
      customerPhone: '+14155559999',
      customerAddress: '456 Test Ave',
      items: [
        { description: 'Toilet Install', quantity: 1, unit_price: 450, unit: 'each' }
      ],
      whatsappThreadId: 'test-thread'
    })
  })
  
  const { quote } = await quoteResponse.json()
  console.log('Quote created:', quote.id)
  
  // 2. Simulate voice edit
  const editResponse = await fetch('/api/quotes/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteId: quote.id,
      voiceTranscript: 'Change toilet to 550 and add wax ring for 25',
      action: 'process',
      sessionId: 'test-session'
    })
  })
  
  const { message } = await editResponse.json()
  console.log('Edit confirmation:', message)
  
  // 3. Confirm changes
  const confirmResponse = await fetch('/api/quotes/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteId: quote.id,
      action: 'confirm',
      sessionId: 'test-session'
    })
  })
  
  console.log('Changes applied!')
}
```

## Production Deployment Checklist

- [ ] Set `USE_MOCK_GPT=false` and add real OpenAI API key
- [ ] Configure production Twilio WhatsApp Business API
- [ ] Set up proper webhook authentication
- [ ] Enable Supabase RLS policies
- [ ] Configure storage bucket permissions
- [ ] Set up monitoring and error reporting
- [ ] Test with real phone numbers
- [ ] Add rate limiting to prevent abuse