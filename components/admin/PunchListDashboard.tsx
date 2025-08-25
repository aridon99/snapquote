'use client';

// F14A Punch List Magic - Admin Dashboard Component
// Monitors voice message processing pipeline and provides manual controls

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MessageSquare, 
  UserCheck, 
  MessageCircle, 
  RefreshCw, 
  Play, 
  Pause,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';

interface PipelineStatus {
  voice_messages: Record<string, number>;
  punch_list_items: Record<string, number>;
  assignments: Record<string, number>;
  health_check: {
    status: string;
    openai_connected: boolean;
    supabase_connected: boolean;
  };
  timestamp: string;
}

interface ProcessingResult {
  success: boolean;
  action: string;
  results?: any;
  error?: string;
  details?: string;
}

export default function PunchListDashboard() {
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedVoiceMessage, setSelectedVoiceMessage] = useState('');

  // Fetch pipeline status
  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/punch-list/process?action=status');
      const data = await response.json();
      
      if (data.success) {
        setPipelineStatus(data.data);
      } else {
        console.error('Failed to fetch status:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pipeline status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute pipeline action
  const executeAction = async (action: string, options?: any) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/punch-list/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...options }),
      });
      
      const result = await response.json();
      setProcessingResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
      // Refresh status after processing
      await fetchStatus();
      
      return result;
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      const errorResult = {
        success: false,
        action,
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
      setProcessingResults(prev => [errorResult, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh setup
  useEffect(() => {
    fetchStatus();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const StatusCard = ({ title, icon: Icon, count, color = 'blue' }: {
    title: string;
    icon: any;
    count: number;
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
          <Icon className={`h-8 w-8 text-${color}-500`} />
        </div>
      </CardContent>
    </Card>
  );

  const ActionButton = ({ 
    action, 
    label, 
    description, 
    variant = 'default' as const,
    options = {} 
  }: {
    action: string;
    label: string;
    description: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    options?: any;
  }) => (
    <div className="space-y-2">
      <Button
        onClick={() => executeAction(action, options)}
        disabled={isLoading}
        variant={variant}
        className="w-full"
      >
        {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
        {label}
      </Button>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Punch List Magic Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button
            onClick={fetchStatus}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* Health Check */}
      {pipelineStatus?.health_check && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {pipelineStatus.health_check.status === 'healthy' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Badge variant={pipelineStatus.health_check.openai_connected ? 'default' : 'destructive'}>
                OpenAI: {pipelineStatus.health_check.openai_connected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Badge variant={pipelineStatus.health_check.supabase_connected ? 'default' : 'destructive'}>
                Supabase: {pipelineStatus.health_check.supabase_connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard
          title="Voice Messages"
          icon={Mic}
          count={(pipelineStatus?.voice_messages.received || 0) + (pipelineStatus?.voice_messages.transcribing || 0)}
          color="blue"
        />
        <StatusCard
          title="Transcriptions"
          icon={MessageSquare}
          count={pipelineStatus?.voice_messages.transcribed || 0}
          color="green"
        />
        <StatusCard
          title="Punch List Items"
          icon={UserCheck}
          count={Object.values(pipelineStatus?.punch_list_items || {}).reduce((a, b) => a + b, 0)}
          color="purple"
        />
        <StatusCard
          title="SMS Sent"
          icon={MessageCircle}
          count={pipelineStatus?.assignments.pending || 0}
          color="orange"
        />
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline Status</TabsTrigger>
          <TabsTrigger value="controls">Manual Controls</TabsTrigger>
          <TabsTrigger value="logs">Processing Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          {/* Voice Messages Status */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Messages Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStatus?.voice_messages && Object.entries(pipelineStatus.voice_messages).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={status === 'failed' ? 'destructive' : 'default'}>
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Punch List Items Status */}
          <Card>
            <CardHeader>
              <CardTitle>Punch List Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStatus?.punch_list_items && Object.entries(pipelineStatus.punch_list_items).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contractor Assignments Status */}
          <Card>
            <CardHeader>
              <CardTitle>Contractor Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineStatus?.assignments && Object.entries(pipelineStatus.assignments).map(([response, count]) => (
                  <div key={response} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        response === 'completed' ? 'default' :
                        response === 'declined' ? 'destructive' :
                        'secondary'
                      }>
                        {response.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionButton
              action="process_transcriptions"
              label="Process Transcriptions"
              description="Convert pending voice messages to text"
              variant="default"
            />
            
            <ActionButton
              action="process_extractions"
              label="Extract Punch Lists"
              description="AI extraction of tasks from transcriptions"
              variant="default"
            />
            
            <ActionButton
              action="process_assignments"
              label="Assign Contractors"
              description="Match contractors to punch list items"
              variant="default"
            />
            
            <ActionButton
              action="process_sms"
              label="Send SMS"
              description="Notify contractors via SMS"
              variant="default"
            />
            
            <ActionButton
              action="send_reminders"
              label="Send Reminders"
              description="Remind contractors of pending tasks"
              variant="outline"
            />
            
            <ActionButton
              action="process_pipeline"
              label="Process Full Pipeline"
              description="Run all pipeline steps in sequence"
              variant="secondary"
            />
          </div>

          {/* Individual Voice Message Processing */}
          <Card>
            <CardHeader>
              <CardTitle>Process Individual Voice Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Voice Message ID"
                  value={selectedVoiceMessage}
                  onChange={(e) => setSelectedVoiceMessage(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <Button
                  onClick={() => executeAction('process_voice_message', { voice_message_id: selectedVoiceMessage })}
                  disabled={!selectedVoiceMessage || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Process a specific voice message through the entire pipeline
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {processingResults.length === 0 ? (
                  <p className="text-gray-500 text-center">No processing logs yet</p>
                ) : (
                  processingResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.action}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {result.results?.message && (
                        <p className="text-sm text-green-600">{result.results.message}</p>
                      )}
                      
                      {result.error && (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                      
                      {result.details && (
                        <p className="text-xs text-gray-500">{result.details}</p>
                      )}
                      
                      {result.results?.errors && result.results.errors.length > 0 && (
                        <div className="space-y-1">
                          {result.results.errors.map((error: string, errorIndex: number) => (
                            <p key={errorIndex} className="text-xs text-red-500">{error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {pipelineStatus && (
        <div className="text-xs text-gray-500 text-center">
          Last updated: {new Date(pipelineStatus.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}