'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

export function SimpleChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-50"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border-2 border-white"
          style={{
            position: 'relative',
            zIndex: 9999
          }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      </div>
    )
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-50"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999
      }}
    >
      <div className="w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-red-500 text-white rounded-t-lg">
          <div>
            <h3 className="font-semibold text-sm">Emma</h3>
            <p className="text-xs opacity-90">Renovation Assistant</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-red-600 h-8 w-8 p-0 rounded flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 h-64 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h4 className="font-semibold mb-2">Chat Widget Test</h4>
            <p className="text-sm text-gray-600">
              This is a simple test to ensure the floating widget appears correctly.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Test Widget - API Integration Coming Soon
          </p>
        </div>
      </div>
    </div>
  )
}

export default SimpleChatbotWidget