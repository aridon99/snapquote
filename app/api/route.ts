import { NextResponse } from 'next/server';

// Root API endpoint to force Vercel to recognize API structure
export async function GET() {
  return NextResponse.json({ 
    message: "API root is working",
    timestamp: new Date().toISOString(),
    routes: [
      "/api/test",
      "/api/health", 
      "/api/contractors/signup"
    ]
  });
}