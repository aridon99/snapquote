import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {
      env_vars: false,
      supabase_connection: false,
      database_query: false
    },
    errors: [] as string[]
  };

  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      results.checks.env_vars = true;
    } else {
      results.errors.push(`Missing env vars - URL: ${!!supabaseUrl}, KEY: ${!!supabaseKey}`);
    }

    // Try to create Supabase client
    try {
      const supabase = await createClient();
      results.checks.supabase_connection = true;
      
      // Try a simple query
      const { data, error } = await supabase
        .from('contractors')
        .select('count')
        .limit(1);
      
      if (error) {
        results.errors.push(`Database query error: ${error.message}`);
      } else {
        results.checks.database_query = true;
      }
    } catch (error) {
      results.errors.push(`Supabase client error: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    results.errors.push(`General error: ${error instanceof Error ? error.message : String(error)}`);
  }

  const allChecksPass = Object.values(results.checks).every(v => v === true);
  
  return NextResponse.json({
    success: allChecksPass,
    ...results
  });
}