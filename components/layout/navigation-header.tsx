'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Phone, 
  Menu, 
  X,
  ChevronDown,
  Calendar,
  Calculator,
  BookOpen,
  Users,
  Award
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavigationHeaderProps {
  isAuthenticated?: boolean
  userName?: string
}

export function NavigationHeader({ isAuthenticated = false, userName }: NavigationHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 bg-brand-warm-white/95 backdrop-blur-md border-b border-brand-sand/20 shadow-sm">
      {/* Top bar with trust elements */}
      <div className="bg-brand-navy text-white py-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-6">
              <span className="flex items-center">
                <Award className="h-4 w-4 mr-1 text-brand-clay" />
                Licensed & Insured
              </span>
              <span className="hidden sm:flex items-center">
                <Users className="h-4 w-4 mr-1 text-brand-sage-light" />
                500+ Happy Homeowners
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="tel:1-800-RENOVATE" className="flex items-center hover:text-brand-cream transition-colors">
                <Phone className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">1-800-RENOVATE</span>
                <span className="sm:hidden">Call Us</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and brand */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-terracotta/20 rounded-xl blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gradient-to-br from-brand-terracotta to-brand-terracotta-dark p-2 rounded-xl shadow-md">
                  <Home className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-brand-navy">
                  RenovationAdvisor
                </span>
                <span className="hidden lg:block text-xs text-brand-stone">
                  Your Trusted Partner
                </span>
              </div>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link 
                href="/how-it-works" 
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive('/how-it-works') 
                    ? 'bg-brand-sand text-brand-terracotta' 
                    : 'text-brand-navy hover:bg-brand-cream hover:text-brand-terracotta'
                }`}
              >
                How It Works
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="px-4 py-2 rounded-lg font-medium text-brand-navy hover:bg-brand-cream hover:text-brand-terracotta transition-all flex items-center">
                  Services
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-brand-sand">
                  <DropdownMenuItem asChild>
                    <Link href="/services/kitchen" className="flex items-center">
                      <span className="mr-2">🍳</span>
                      Kitchen Renovation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/services/bathroom" className="flex items-center">
                      <span className="mr-2">🚿</span>
                      Bathroom Remodel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/services/whole-home" className="flex items-center">
                      <span className="mr-2">🏡</span>
                      Whole Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/services/additions" className="flex items-center">
                      <span className="mr-2">🔨</span>
                      Additions
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="px-4 py-2 rounded-lg font-medium text-brand-navy hover:bg-brand-cream hover:text-brand-terracotta transition-all flex items-center">
                  Resources
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-brand-sand">
                  <DropdownMenuItem asChild>
                    <Link href="/cost-calculator" className="flex items-center">
                      <Calculator className="h-4 w-4 mr-2 text-brand-sage" />
                      Cost Calculator
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/project-planner" className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-brand-sage" />
                      Project Planner
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/guides" className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-brand-sage" />
                      Renovation Guides
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link 
                href="/gallery" 
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive('/gallery') 
                    ? 'bg-brand-sand text-brand-terracotta' 
                    : 'text-brand-navy hover:bg-brand-cream hover:text-brand-terracotta'
                }`}
              >
                Gallery
              </Link>

              <Link 
                href="/testimonials" 
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive('/testimonials') 
                    ? 'bg-brand-sand text-brand-terracotta' 
                    : 'text-brand-navy hover:bg-brand-cream hover:text-brand-terracotta'
                }`}
              >
                Reviews
              </Link>
            </nav>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-brand-sage text-brand-sage hover:bg-brand-sage/10">
                      Dashboard
                    </Button>
                  </Link>
                  <span className="text-sm text-brand-stone">
                    Welcome, {userName}
                  </span>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" className="border-brand-stone text-brand-navy hover:bg-brand-cream">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/intake">
                    <Button className="bg-brand-terracotta hover:bg-brand-terracotta-dark text-white shadow-md hover:shadow-lg transition-all">
                      Get Free Quote
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-brand-navy hover:bg-brand-cream"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-brand-sand/20">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/how-it-works" 
                className="px-4 py-2 rounded-lg text-brand-navy hover:bg-brand-cream"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/services" 
                className="px-4 py-2 rounded-lg text-brand-navy hover:bg-brand-cream"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link 
                href="/gallery" 
                className="px-4 py-2 rounded-lg text-brand-navy hover:bg-brand-cream"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Gallery
              </Link>
              <Link 
                href="/testimonials" 
                className="px-4 py-2 rounded-lg text-brand-navy hover:bg-brand-cream"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Reviews
              </Link>
              
              <div className="pt-4 border-t border-brand-sand/20 space-y-2">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button className="w-full" variant="outline">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button className="w-full" variant="outline">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/intake">
                      <Button className="w-full bg-brand-terracotta hover:bg-brand-terracotta-dark text-white">
                        Get Free Quote
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}