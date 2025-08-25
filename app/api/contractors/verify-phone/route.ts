// API endpoint for contractor phone verification
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { verificationCode, contractorId } = await request.json()

    // Validate input
    if (!verificationCode || !contractorId) {
      return NextResponse.json(
        { error: 'Verification code and contractor ID are required' },
        { status: 400 }
      )
    }

    // Find contractor with matching code
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('*')
      .eq('id', contractorId)
      .eq('verification_code', verificationCode)
      .gt('verification_expires_at', new Date().toISOString())
      .single()

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Update contractor as verified
    const { error: updateError } = await supabase
      .from('contractors')
      .update({
        whatsapp_verified: true,
        whatsapp_opt_in_date: new Date().toISOString(),
        onboarding_status: 'phone_verified',
        verification_code: null, // Clear the code
        verification_expires_at: null
      })
      .eq('id', contractor.id)

    if (updateError) {
      console.error('Error updating contractor:', updateError)
      return NextResponse.json(
        { error: 'Failed to verify phone number' },
        { status: 500 }
      )
    }

    // Update onboarding progress
    const { error: progressError } = await supabase
      .from('contractor_onboarding_progress')
      .upsert({
        contractor_id: contractor.id,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (progressError) {
      console.error('Error updating progress:', progressError)
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully'
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractorId')

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Contractor ID is required' },
        { status: 400 }
      )
    }

    // Get contractor verification status
    const { data: contractor, error } = await supabase
      .from('contractors')
      .select('whatsapp_verified, verification_code, verification_expires_at, onboarding_status')
      .eq('id', contractorId)
      .single()

    if (error || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      )
    }

    // Check if code is still valid
    const codeValid = contractor.verification_code && 
      contractor.verification_expires_at && 
      new Date(contractor.verification_expires_at) > new Date()

    return NextResponse.json({
      verified: contractor.whatsapp_verified,
      hasValidCode: !!codeValid,
      verificationCode: codeValid ? contractor.verification_code : null,
      onboardingStatus: contractor.onboarding_status
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}