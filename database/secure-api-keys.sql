-- Secure API Key Storage in Supabase Vault
-- Run this in your Supabase SQL editor to securely store API keys

-- Store API keys in Supabase Vault (encrypted)
SELECT vault.create_secret(
  'twilio_account_sid',
  'ACed0029f58fdb13be88e72ecd1dd2f6c8'  -- Replace with your actual Twilio Account SID
);

SELECT vault.create_secret(
  'twilio_auth_token', 
  '1c40040e48c05047dcdae28166ecbbe2'  -- Replace with your actual Twilio Auth Token
);

SELECT vault.create_secret(
  'openai_api_key',
  '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'  -- Replace with your actual OpenAI API Key
);

-- Create a function to securely retrieve API keys
CREATE OR REPLACE FUNCTION get_api_key(key_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    api_key TEXT;
BEGIN
    -- Only allow specific key names for security
    IF key_name NOT IN ('twilio_account_sid', 'twilio_auth_token', 'openai_api_key') THEN
        RAISE EXCEPTION 'Invalid API key name: %', key_name;
    END IF;
    
    -- Get the decrypted secret
    SELECT decrypted_secret INTO api_key 
    FROM vault.decrypted_secrets 
    WHERE name = key_name;
    
    IF api_key IS NULL THEN
        RAISE EXCEPTION 'API key not found: %', key_name;
    END IF;
    
    RETURN api_key;
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_api_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_key(TEXT) TO service_role;

-- Create API key retrieval functions for easier access
CREATE OR REPLACE FUNCTION get_twilio_credentials()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'account_sid', get_api_key('twilio_account_sid'),
        'auth_token', get_api_key('twilio_auth_token')
    ) INTO result;
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_openai_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN get_api_key('openai_api_key');
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_twilio_credentials() TO authenticated;
GRANT EXECUTE ON FUNCTION get_twilio_credentials() TO service_role;
GRANT EXECUTE ON FUNCTION get_openai_key() TO authenticated;
GRANT EXECUTE ON FUNCTION get_openai_key() TO service_role;