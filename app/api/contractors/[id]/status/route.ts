import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET handler to check contractor verification status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractorId = params.id;

    if (!contractorId) {
      return NextResponse.json(
        { success: false, message: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Get contractor status
    const { data: contractor, error } = await supabase
      .from('contractors')
      .select('id, contact_name, business_name, phone, whatsapp_verified, onboarding_status')
      .eq('id', contractorId)
      .single();

    if (error || !contractor) {
      return NextResponse.json(
        { success: false, message: 'Contractor not found' },
        { status: 404 }
      );
    }

    // Get onboarding progress
    const { data: progress } = await supabase
      .from('contractor_onboarding_progress')
      .select('*')
      .eq('contractor_id', contractorId)
      .single();

    return NextResponse.json({
      success: true,
      contractor: {
        id: contractor.id,
        contact_name: contractor.contact_name,
        business_name: contractor.business_name,
        phone: contractor.phone,
        whatsapp_verified: contractor.whatsapp_verified,
        onboarding_status: contractor.onboarding_status
      },
      progress: progress || {},
      quick_win_ready: contractor.whatsapp_verified && !progress?.quick_win_completed
    });

  } catch (error) {
    console.error('Error checking contractor status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}