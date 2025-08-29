/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side packages that should remain external
  serverExternalPackages: ['@react-pdf/renderer', 'pdfkit'],
  
  // Image optimization for production
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Performance optimizations for mobile
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Build-time environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'RenovationAdvisor',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },
  
  // Redirects for SEO and user experience
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/contractor/dashboard',
        permanent: false
      }
    ]
  },
  
  // Ensure API routes are properly handled
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig