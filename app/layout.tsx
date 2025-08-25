import type { Metadata } from 'next'
import { Open_Sans, Playfair_Display } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/lib/providers/query-provider'
import './globals.css'

const openSans = Open_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-open-sans'
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair'
})

export const metadata: Metadata = {
  title: 'RenovationAdvisor - Voice-Enabled Contractor Quoting',
  description: 'Revolutionary phone-first platform for contractors. Generate quotes with voice commands, edit via WhatsApp, and deliver PDFs instantly.',
  keywords: ['contractor', 'plumber', 'electrician', 'quotes', 'whatsapp', 'voice', 'mobile'],
  authors: [{ name: 'RenovationAdvisor Team' }],
  creator: 'RenovationAdvisor',
  publisher: 'RenovationAdvisor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RenovationAdvisor',
    // startupImage: '/icon-192x192.png'
  },
  manifest: '/manifest.json'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${openSans.variable} ${playfair.variable} font-sans`}>
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}