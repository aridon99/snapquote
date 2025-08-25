import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import PunchListDashboard from '@/components/admin/PunchListDashboard';

export const metadata: Metadata = {
  title: 'Punch List Magic Dashboard | Renovation Advisor',
  description: 'Monitor and manage voice-to-SMS punch list processing pipeline',
};

export default async function PunchListDashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-4xl font-bold">Punch List Magic</h1>
        <p className="text-gray-600 mt-2">
          F14A: Voice Message → AI Extraction → Contractor SMS Pipeline
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">How F14A Works</h2>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>1. Voice Input:</strong> Homeowners send WhatsApp voice messages describing punch list items</p>
          <p><strong>2. AI Transcription:</strong> Whisper converts speech to text with high accuracy</p>
          <p><strong>3. Smart Extraction:</strong> GPT-4o-mini identifies tasks, priorities, and categories</p>
          <p><strong>4. Auto Assignment:</strong> Algorithm matches tasks to contractors by specialty and availability</p>
          <p><strong>5. SMS Delivery:</strong> Contractors receive structured task notifications via SMS</p>
          <p><strong>6. Response Tracking:</strong> SMS responses are processed automatically (ACCEPT/DECLINE/COMPLETED)</p>
        </div>
      </div>

      <PunchListDashboard />

      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Pipeline Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium">Voice Processing</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• WhatsApp Business API integration</li>
              <li>• Whisper AI transcription (local or API)</li>
              <li>• Automatic language detection</li>
              <li>• Audio file storage in Supabase</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Task Management</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• GPT-4o-mini task extraction</li>
              <li>• 12 specialized trade categories</li>
              <li>• Priority levels (urgent/high/medium/low)</li>
              <li>• Material needs identification</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Contractor Matching</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Specialty-based scoring algorithm</li>
              <li>• Availability status consideration</li>
              <li>• Project relationship bonuses</li>
              <li>• Rating and performance factors</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">SMS Communication</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Twilio SMS delivery</li>
              <li>• Priority-based message templates</li>
              <li>• Response parsing (ACCEPT/DECLINE)</li>
              <li>• Automatic reminder system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}