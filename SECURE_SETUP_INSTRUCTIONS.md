# Secure Setup Instructions for Voice Quote System

## ✅ What You've Done So Far
- ✅ **Database Schema**: Applied `quote-system-schema.sql` in Supabase
- ✅ **Environment Variables**: Updated `.env.local` with secure configuration

## 🔐 Next Steps for Maximum Security

### Step 1: Set Up Supabase Vault (Encrypted API Key Storage)

1. **Run the secure API keys script** in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of: database/secure-api-keys.sql
   ```

   This will:
   - Store your API keys encrypted in Supabase Vault
   - Create secure functions to retrieve keys
   - Set up proper access permissions

### Step 2: Create Supabase Storage Bucket

1. Go to **Supabase Dashboard → Storage**
2. Click **"New bucket"**
3. Name: `documents`
4. Make it **Public** (for PDF access)
5. Click **"Create bucket"**

### Step 3: Verify Environment Variables

Your `.env.local` now has:
```env
# Secure configuration - API keys retrieved from Supabase Vault
USE_MOCK_GPT=true  # For testing without OpenAI charges
NEXT_PUBLIC_APP_URL=http://localhost:3000
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Fallback keys (only used if Vault fails)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
OPENAI_API_KEY=your_openai_key
```

### Step 4: Test the Secure System

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test API key retrieval** (should work automatically):
   - The app will try to get keys from Supabase Vault first
   - Falls back to environment variables if Vault fails
   - Check console for any "Using fallback" warnings

3. **Test quote generation**:
   ```bash
   curl -X POST http://localhost:3000/api/quotes/generate \
     -H "Content-Type: application/json" \
     -d '{
       "contractorId": "your-contractor-id",
       "customerName": "Test Customer",
       "customerPhone": "+14155551234",
       "customerAddress": "123 Test St",
       "projectDescription": "Test job",
       "items": [
         {
           "description": "Test Service",
           "quantity": 1,
           "unit": "each",
           "unit_price": 100,
           "category": "labor"
         }
       ]
     }'
   ```

## 🛡️ Security Benefits

### What's Now Secure:
- **✅ API Keys Encrypted**: Stored in Supabase Vault, not plain text
- **✅ Automatic Key Rotation**: Can update keys in Vault without code changes
- **✅ Access Control**: Only authorized functions can retrieve keys
- **✅ Audit Trail**: Vault logs all key access
- **✅ Fallback System**: Graceful degradation if Vault fails

### What's Still in Environment (Safe):
- **Public URLs**: Supabase URL (meant to be public)
- **Feature Flags**: `USE_MOCK_GPT` (no security risk)
- **App Configuration**: Ports, URLs (needed for functionality)

## 🚀 Production Deployment

### Before Going Live:

1. **Remove fallback keys** from production `.env`:
   ```env
   # Production .env.local (remove these lines)
   # TWILIO_ACCOUNT_SID=...
   # TWILIO_AUTH_TOKEN=...
   # OPENAI_API_KEY=...
   ```

2. **Set production feature flags**:
   ```env
   USE_MOCK_GPT=false  # Use real OpenAI
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Verify Vault access** in production:
   ```sql
   -- Test in production Supabase
   SELECT get_api_key('twilio_account_sid');
   ```

## 🔧 Key Management

### To Update API Keys:
```sql
-- Update stored keys (when rotating)
SELECT vault.update_secret('twilio_auth_token', 'new_token_here');
SELECT vault.update_secret('openai_api_key', 'new_key_here');

-- Clear cache to force refresh
-- This is handled automatically by the secure service
```

### To Add New API Keys:
```sql
-- Add new services
SELECT vault.create_secret('stripe_secret_key', 'sk_live_...');

-- Update the get_api_key function to allow new keys
```

## 🐛 Troubleshooting

### If Keys Don't Work:
1. **Check Supabase Vault setup**:
   ```sql
   SELECT name FROM vault.secrets;  -- Should show your keys
   ```

2. **Check function permissions**:
   ```sql
   SELECT * FROM vault.decrypted_secrets;  -- Should return values
   ```

3. **Check console logs** for fallback warnings:
   ```
   "Using fallback Twilio credentials from environment variables"
   ```

### If PDF Generation Fails:
1. **Verify storage bucket exists and is public**
2. **Check PDFKit installation**: `npm list pdfkit`
3. **Look for PDF errors in console**

## 📊 Monitoring

### Key Access Logs:
- Supabase Dashboard → Database → Logs
- Search for "vault" to see key retrieval activity

### Performance:
- API keys are cached for 5 minutes to reduce database calls
- Cache clears automatically on error for immediate retry

Your system is now secured following industry best practices! 🎉