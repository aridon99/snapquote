import { NextResponse } from 'next/server'

export async function GET() {
  // Simple health check that will always work
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'snapquote-mvp-v1',
    // This will help us know if our changes are deployed
    deployment_marker: 'AFTER_RECOMMENDATIONS_REMOVAL'
  })
}