-- Test Validation and Logging Database Schema
-- Tracks test execution results and validation progress

-- Test logs table for storing all test events
CREATE TABLE IF NOT EXISTS test_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN (
        'TEST_START', 'TEST_PASS', 'TEST_FAIL', 'TEST_SKIP',
        'API_CALL', 'API_SUCCESS', 'API_ERROR',
        'DB_OPERATION', 'PDF_GENERATION', 'WEBHOOK_EVENT',
        'SECURITY_CHECK', 'INFO', 'DEBUG'
    )),
    category TEXT NOT NULL,
    test_name TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    duration_ms INTEGER,
    stack_trace TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Test validation items - master checklist of testable features
CREATE TABLE IF NOT EXISTS test_validation_items (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    test_name TEXT NOT NULL,
    description TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    depends_on TEXT[], -- Array of test IDs that must pass first
    auto_detectable BOOLEAN DEFAULT true,
    test_function TEXT, -- Function name to run for validation
    expected_result JSONB,
    status TEXT CHECK (status IN ('pending', 'running', 'passed', 'failed', 'skipped')) DEFAULT 'pending',
    last_run TIMESTAMP,
    last_result JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test execution results - track each test run
CREATE TABLE IF NOT EXISTS test_execution_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    validation_item_id TEXT REFERENCES test_validation_items(id),
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
    duration_ms INTEGER,
    result_data JSONB,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT NOW(),
    executed_by TEXT -- User or system that ran the test
);

-- Test sessions - group related tests together
CREATE TABLE IF NOT EXISTS test_sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    status TEXT CHECK (status IN ('running', 'completed', 'failed', 'cancelled')) DEFAULT 'running',
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    created_by TEXT,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_test_logs_session ON test_logs(session_id);
CREATE INDEX idx_test_logs_category ON test_logs(category);
CREATE INDEX idx_test_logs_level ON test_logs(level);
CREATE INDEX idx_test_logs_created ON test_logs(created_at);
CREATE INDEX idx_test_validation_status ON test_validation_items(status);
CREATE INDEX idx_test_validation_category ON test_validation_items(category);
CREATE INDEX idx_test_execution_session ON test_execution_results(session_id);
CREATE INDEX idx_test_execution_status ON test_execution_results(status);

-- Function to update validation item status
CREATE OR REPLACE FUNCTION update_validation_item_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the validation item when a new test result is logged
    UPDATE test_validation_items 
    SET 
        status = CASE 
            WHEN NEW.level IN ('TEST_PASS', 'API_SUCCESS') THEN 'passed'
            WHEN NEW.level IN ('TEST_FAIL', 'API_ERROR') THEN 'failed'
            WHEN NEW.level IN ('TEST_START', 'API_CALL') THEN 'running'
            ELSE status
        END,
        last_run = NEW.created_at,
        last_result = NEW.data,
        updated_at = NOW()
    WHERE category = NEW.category 
      AND test_name = NEW.test_name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update validation items from logs
CREATE TRIGGER update_validation_on_log
    AFTER INSERT ON test_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_validation_item_status();

-- Function to get test session summary
CREATE OR REPLACE FUNCTION get_test_session_summary(p_session_id TEXT)
RETURNS TABLE(
    session_id TEXT,
    total_logs INTEGER,
    test_passes INTEGER,
    test_failures INTEGER,
    api_calls INTEGER,
    api_successes INTEGER,
    api_errors INTEGER,
    avg_duration_ms NUMERIC,
    started_at TIMESTAMP,
    latest_activity TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_session_id as session_id,
        COUNT(*)::INTEGER as total_logs,
        COUNT(*) FILTER (WHERE level = 'TEST_PASS')::INTEGER as test_passes,
        COUNT(*) FILTER (WHERE level = 'TEST_FAIL')::INTEGER as test_failures,
        COUNT(*) FILTER (WHERE level = 'API_CALL')::INTEGER as api_calls,
        COUNT(*) FILTER (WHERE level = 'API_SUCCESS')::INTEGER as api_successes,
        COUNT(*) FILTER (WHERE level = 'API_ERROR')::INTEGER as api_errors,
        AVG(duration_ms) as avg_duration_ms,
        MIN(created_at) as started_at,
        MAX(created_at) as latest_activity
    FROM test_logs 
    WHERE test_logs.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get validation status overview
CREATE OR REPLACE FUNCTION get_validation_overview()
RETURNS TABLE(
    total_items INTEGER,
    pending_items INTEGER,
    running_items INTEGER,
    passed_items INTEGER,
    failed_items INTEGER,
    required_pending INTEGER,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_items,
        COUNT(*) FILTER (WHERE status = 'running')::INTEGER as running_items,
        COUNT(*) FILTER (WHERE status = 'passed')::INTEGER as passed_items,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_items,
        COUNT(*) FILTER (WHERE status = 'pending' AND required = true)::INTEGER as required_pending,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'passed')::NUMERIC / COUNT(*) * 100), 2)
            ELSE 0 
        END as completion_percentage
    FROM test_validation_items;
END;
$$ LANGUAGE plpgsql;

-- Insert core validation items
INSERT INTO test_validation_items (
    id, category, test_name, description, required, depends_on, auto_detectable
) VALUES 
    ('database_connection', 'database', 'connection', 'Database connection and basic queries work', true, '{}', true),
    ('supabase_storage', 'database', 'storage', 'Supabase storage bucket accessible', true, '{"database_connection"}', true),
    ('api_key_retrieval', 'security', 'api_keys', 'API keys retrieved securely from Supabase Vault', true, '{"database_connection"}', true),
    ('quote_generation', 'quote-system', 'generation', 'Quote can be generated from API call', true, '{"database_connection"}', true),
    ('pdf_generation', 'pdf', 'generation', 'PDF quote can be generated and stored', true, '{"quote_generation", "supabase_storage"}', true),
    ('voice_edit_processing', 'quote-system', 'edit', 'Voice edit commands can be processed', true, '{"quote_generation"}', true),
    ('quote_edit_confirmation', 'quote-system', 'edit_confirm', 'Quote edits can be confirmed and applied', true, '{"voice_edit_processing"}', true),
    ('whatsapp_webhook', 'whatsapp', 'webhook', 'WhatsApp webhook receives and processes messages', true, '{}', true),
    ('whatsapp_message_send', 'whatsapp', 'send_message', 'WhatsApp messages can be sent successfully', true, '{"api_key_retrieval"}', true),
    ('whatsapp_pdf_send', 'whatsapp', 'send_pdf', 'WhatsApp PDF attachments can be sent', true, '{"whatsapp_message_send", "pdf_generation"}', true),
    ('contractor_signup', 'auth', 'contractor_signup', 'Contractor can sign up and create account', true, '{"database_connection"}', false),
    ('contractor_verification', 'auth', 'phone_verification', 'Contractor phone verification works', true, '{"contractor_signup"}', false),
    ('mock_consultation_processing', 'integration', 'mock_consultation', 'Mock consultation can be processed into quote', true, '{"quote_generation"}', true),
    ('complete_quote_flow', 'integration', 'end_to_end', 'Complete flow: consultation → quote → edit → send', true, '{"quote_generation", "voice_edit_processing", "pdf_generation", "whatsapp_pdf_send"}', false),
    ('security_rls_policies', 'security', 'rls_policies', 'Row Level Security policies are working', true, '{"database_connection"}', true),
    ('error_handling', 'system', 'error_handling', 'Proper error handling and logging', true, '{}', true)
ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    depends_on = EXCLUDED.depends_on,
    updated_at = NOW();

-- RLS Policies for security
ALTER TABLE test_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_validation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_execution_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all test data (for development)
CREATE POLICY "Test data readable by authenticated users" ON test_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Test data writable by authenticated users" ON test_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Validation items readable by all" ON test_validation_items
    FOR SELECT USING (true);

CREATE POLICY "Validation items writable by authenticated" ON test_validation_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to service role for API access
GRANT ALL ON test_logs TO service_role;
GRANT ALL ON test_validation_items TO service_role;
GRANT ALL ON test_execution_results TO service_role;
GRANT ALL ON test_sessions TO service_role;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION get_test_session_summary(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_session_summary(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_validation_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION get_validation_overview() TO service_role;