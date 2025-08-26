import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    deployment: {
      timestamp: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown',
      deployed_at: process.env.VERCEL_DEPLOYMENT_ID || 'local',
      node_version: process.version,
      build_id: process.env.NEXT_BUILD_ID || 'development',
      // Add a marker to know which version this is
      version_marker: 'DEPLOYMENT_DEBUG_V1_AFTER_FIX'
    },
    status: 'OK'
  })
}