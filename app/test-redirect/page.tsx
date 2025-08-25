'use client'

export default function TestRedirectPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirect Test Successful!</h1>
        <p className="text-gray-600">If you see this page, the redirect is working.</p>
        <p className="text-sm text-gray-500 mt-4">This is a test page at /test-redirect</p>
      </div>
    </div>
  )
}