import React from 'react'
import Link from 'next/link'
import { 
  Home, 
  Phone, 
  Mail, 
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Shield,
  Award,
  Clock,
  CreditCard
} from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-brand-navy to-brand-navy-dark text-white">
      {/* Trust badges section */}
      <div className="bg-brand-sand/10 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <Shield className="h-8 w-8 text-brand-sage-light mb-2" />
              <h4 className="font-semibold text-sm">Fully Insured</h4>
              <p className="text-xs text-gray-300 mt-1">$2M Liability Coverage</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Award className="h-8 w-8 text-brand-clay mb-2" />
              <h4 className="font-semibold text-sm">Licensed Pros</h4>
              <p className="text-xs text-gray-300 mt-1">All Contractors Verified</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Clock className="h-8 w-8 text-brand-sage-light mb-2" />
              <h4 className="font-semibold text-sm">On-Time Guarantee</h4>
              <p className="text-xs text-gray-300 mt-1">95% On-Time Completion</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <CreditCard className="h-8 w-8 text-brand-clay mb-2" />
              <h4 className="font-semibold text-sm">Secure Payments</h4>
              <p className="text-xs text-gray-300 mt-1">Escrow Protection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/10 p-2 rounded-xl">
                <Home className="h-6 w-6 text-brand-cream" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-white">
                  RenovationAdvisor
                </span>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Transform your house into your dream home with confidence. 
              We connect you with trusted contractors and guide you through 
              every step of your renovation journey.
            </p>
            
            {/* Social links */}
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://youtube.com" 
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services column */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-brand-cream">
              Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/services/kitchen" className="text-gray-300 hover:text-white transition-colors">
                  Kitchen Renovation
                </Link>
              </li>
              <li>
                <Link href="/services/bathroom" className="text-gray-300 hover:text-white transition-colors">
                  Bathroom Remodel
                </Link>
              </li>
              <li>
                <Link href="/services/whole-home" className="text-gray-300 hover:text-white transition-colors">
                  Whole Home
                </Link>
              </li>
              <li>
                <Link href="/services/additions" className="text-gray-300 hover:text-white transition-colors">
                  Home Additions
                </Link>
              </li>
              <li>
                <Link href="/services/outdoor" className="text-gray-300 hover:text-white transition-colors">
                  Outdoor Living
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-brand-cream">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/cost-calculator" className="text-gray-300 hover:text-white transition-colors">
                  Cost Calculator
                </Link>
              </li>
              <li>
                <Link href="/project-planner" className="text-gray-300 hover:text-white transition-colors">
                  Project Planner
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-gray-300 hover:text-white transition-colors">
                  How-To Guides
                </Link>
              </li>
              <li>
                <Link href="/financing" className="text-gray-300 hover:text-white transition-colors">
                  Financing Options
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4 text-brand-cream">
              Get in Touch
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-brand-sage-light flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:1-800-RENOVATE" className="text-white hover:text-brand-cream transition-colors">
                    1-800-RENOVATE
                  </a>
                  <p className="text-xs text-gray-400">Mon-Fri 8am-6pm PST</p>
                </div>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-brand-sage-light flex-shrink-0 mt-0.5" />
                <a href="mailto:hello@renovationadvisor.com" className="text-gray-300 hover:text-white transition-colors">
                  hello@renovationadvisor.com
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-brand-sage-light flex-shrink-0 mt-0.5" />
                <div className="text-gray-300">
                  <p>San Francisco, CA</p>
                  <p className="text-xs text-gray-400">Serving the Bay Area</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © {currentYear} RenovationAdvisor. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/contractors/join" className="text-gray-400 hover:text-white transition-colors">
                For Contractors
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating help widget placeholder */}
      <div className="fixed bottom-6 right-6 z-40">
        <button className="bg-brand-terracotta hover:bg-brand-terracotta-dark text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all group">
          <span className="absolute -top-2 -right-2 bg-brand-sage text-white text-xs px-2 py-1 rounded-full">
            Chat
          </span>
          <Mail className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </footer>
  )
}