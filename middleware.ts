import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Check if Supabase environment variables are configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Skip authentication checks if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'your_supabase_url' || 
      supabaseAnonKey === 'your_supabase_anon_key') {
    console.warn('Supabase environment variables not configured. Skipping authentication.')
    return res
  }
  
  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes
    const protectedRoutes = ['/dashboard', '/projects', '/settings', '/contractors', '/owner', '/advisor', '/admin', '/contractor']
    const authRoutes = ['/login', '/signup']
    const pathname = req.nextUrl.pathname

    // Check if the current route is protected
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    // Redirect to login if accessing protected route without authentication
    if (isProtectedRoute && !user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirect to appropriate dashboard based on role if accessing auth routes while authenticated
    if (isAuthRoute && user) {
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role === 'contractor') {
        // Check if contractor exists in contractors table
        const { data: contractor } = await supabase
          .from('contractors')
          .select('onboarding_status')
          .eq('email', user.email)
          .single()
        
        // If onboarding not complete, go to onboarding
        if (contractor && contractor.onboarding_status !== 'completed') {
          return NextResponse.redirect(new URL('/contractor/onboarding', req.url))
        }
        
        return NextResponse.redirect(new URL('/contractor/dashboard', req.url))
      } else if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/owner/dashboard', req.url))
      }
    }
    
    // Handle generic /dashboard route - redirect based on role
    if (pathname === '/dashboard' && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role === 'contractor') {
        return NextResponse.redirect(new URL('/contractor/dashboard', req.url))
      } else if (profile?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else {
        return NextResponse.redirect(new URL('/owner/dashboard', req.url))
      }
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue without authentication on error
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}