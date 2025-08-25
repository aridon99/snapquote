'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnhancedProgress, BudgetGauge, StatusIndicator } from '@/components/ui/enhanced-progress'
import { ProjectKanban } from '@/components/projects/project-kanban'
import { Plus, Home, DollarSign, Calendar, MessageSquare, TrendingUp, AlertCircle, Layout, List, Clock } from 'lucide-react'
import Link from 'next/link'
import { BudgetTransferWorkflow } from '@/components/budget/budget-transfer'

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<'kanban' | 'list' | 'timeline'>('kanban')
  
  // Mock data for demonstration - Kanban Projects
  const campaignBudget = {
    total: 80000,
    allocated: 80000,
    spent: 28000,
    remaining: 52000
  }

  // Enhanced project data for Kanban board
  const kanbanProjects = [
    {
      id: '1',
      referenceCode: 'KIT-24-JH-001',
      title: 'Kitchen Renovation',
      status: 'in_progress' as const,
      allocated: 45000,
      spent: 28000,
      progress: 65,
      location: 'San Francisco, CA',
      homeowner: 'John Huang',
      dueDate: 'Dec 15, 2024',
      lastActivity: '2 hours ago',
      urgentIssues: 1,
      pendingApprovals: 0,
      tasks: [
        { 
          id: 't1', 
          title: 'Install electrical outlets', 
          priority: 'high' as const,
          estimatedHours: 8,
          comments: 3
        },
        { 
          id: 't2', 
          title: 'Drywall installation', 
          priority: 'medium' as const,
          estimatedHours: 16,
          comments: 1
        }
      ],
      milestones: [
        { label: 'Demo', value: 10, completed: true, date: 'Oct 15' },
        { label: 'Electrical', value: 30, completed: true, date: 'Oct 25' },
        { label: 'Plumbing', value: 50, completed: true, date: 'Nov 5' },
        { label: 'Drywall', value: 70, completed: false, date: 'Nov 15' },
        { label: 'Cabinets', value: 90, completed: false, date: 'Nov 25' }
      ]
    },
    {
      id: '2',
      referenceCode: 'BTH-24-JH-002',
      title: 'Master Bathroom',
      status: 'planning' as const,
      allocated: 20000,
      spent: 0,
      progress: 15,
      location: 'San Francisco, CA',
      homeowner: 'John Huang',
      dueDate: 'Jan 30, 2025',
      lastActivity: '1 day ago',
      urgentIssues: 0,
      pendingApprovals: 2,
      tasks: [
        { 
          id: 't3', 
          title: 'Finalize tile selection', 
          priority: 'medium' as const,
          estimatedHours: 2,
          comments: 5
        }
      ],
      milestones: [
        { label: 'Planning', value: 20, completed: false, date: 'Dec 1' },
        { label: 'Demo', value: 40, completed: false, date: 'Dec 10' },
        { label: 'Rough-in', value: 70, completed: false, date: 'Dec 20' },
        { label: 'Finishes', value: 95, completed: false, date: 'Jan 5' }
      ]
    },
    {
      id: '3',
      referenceCode: 'BTH-24-JH-003',
      title: 'Guest Bathroom',
      status: 'waiting' as const,
      allocated: 15000,
      spent: 0,
      progress: 10,
      location: 'San Francisco, CA',
      homeowner: 'John Huang',
      dueDate: 'Feb 28, 2025',
      lastActivity: '3 days ago',
      urgentIssues: 0,
      pendingApprovals: 1,
      tasks: [
        { 
          id: 't4', 
          title: 'Wait for permits', 
          priority: 'low' as const,
          estimatedHours: 0,
          comments: 2
        }
      ],
      milestones: [
        { label: 'Planning', value: 25, completed: false, date: 'Jan 15' },
        { label: 'Demo', value: 50, completed: false, date: 'Jan 25' },
        { label: 'Finishes', value: 90, completed: false, date: 'Feb 10' }
      ]
    }
  ]

  const activeProjects = kanbanProjects.filter(p => p.status !== 'completed' as any)

  // Convert kanban projects to budget transfer format
  const budgetProjects = kanbanProjects.map(project => ({
    id: project.id,
    title: project.title,
    allocated: project.allocated,
    spent: project.spent,
    remaining: project.allocated - project.spent
  }))

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-warm-white to-brand-cream shadow-sm border-b border-brand-sand/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-serif font-bold text-brand-navy">
                Welcome to Your Project Dashboard
              </h1>
              <p className="text-brand-stone mt-1">
                Track progress, communicate with contractors, and manage your renovation journey
              </p>
            </div>
            <Link href="/intake">
              <Button className="bg-brand-terracotta hover:bg-brand-terracotta-dark text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Start New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Budget Overview */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-brand-sage/5 to-brand-terracotta/5 border-brand-sand shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-brand-navy">
                <DollarSign className="h-5 w-5 text-brand-terracotta" />
                Your Renovation Investment
              </CardTitle>
              <CardDescription className="text-brand-stone">Total budget allocation and spending across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-brand-navy">${campaignBudget.total.toLocaleString()}</div>
                  <p className="text-sm text-brand-stone">Total Budget</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-terracotta">${campaignBudget.spent.toLocaleString()}</div>
                  <p className="text-sm text-brand-stone">Invested</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-sage">${campaignBudget.remaining.toLocaleString()}</div>
                  <p className="text-sm text-brand-stone">Available</p>
                </div>
              </div>
              <div className="mt-4">
                <BudgetGauge 
                  allocated={campaignBudget.total} 
                  spent={campaignBudget.spent}
                  showDetails={false}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-brand-sand/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-brand-stone-dark">Active Projects</CardTitle>
              <Home className="h-4 w-4 text-brand-terracotta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-navy">{activeProjects.length}</div>
              <p className="text-xs text-brand-stone">of {kanbanProjects.length} total</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-brand-sage mr-1" />
                <span className="text-xs text-brand-sage-dark">On track</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-brand-sand/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-brand-stone-dark">Overall Progress</CardTitle>
              <Calendar className="h-4 w-4 text-brand-sage" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-navy">35%</div>
              <p className="text-xs text-brand-stone">Average completion</p>
              <EnhancedProgress 
                value={35} 
                size="sm" 
                showPercentage={false}
                className="mt-2"
              />
            </CardContent>
          </Card>
          
          <Card className="border-brand-sand/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-brand-stone-dark">Next Milestone</CardTitle>
              <AlertCircle className="h-4 w-4 text-brand-clay" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-brand-navy">Drywall</div>
              <p className="text-xs text-brand-stone">Due Nov 15</p>
              <StatusIndicator status="in_progress" size="sm" className="mt-2" />
            </CardContent>
          </Card>
          
          <Card className="border-brand-sand/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-brand-stone-dark">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-brand-terracotta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-navy">5</div>
              <p className="text-xs text-brand-stone">unread</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Kanban Board */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif font-semibold text-brand-navy">Your Projects</h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-brand-sage/10 text-brand-sage-dark border-brand-sage/20">{activeProjects.length} active projects</Badge>
              <div className="flex border border-brand-sand rounded-lg bg-brand-warm-white">
                <Button 
                  variant={currentView === 'kanban' ? 'default' : 'ghost'} 
                  size="sm" 
                  className={`rounded-r-none border-r border-brand-sand ${
                    currentView === 'kanban' 
                      ? 'bg-brand-terracotta hover:bg-brand-terracotta-dark text-white' 
                      : 'text-brand-stone hover:text-brand-navy hover:bg-brand-cream'
                  }`}
                  onClick={() => setCurrentView('kanban')}
                >
                  <Layout className="w-4 h-4 mr-1" />
                  Kanban
                </Button>
                <Button 
                  variant={currentView === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  className={`rounded-none border-r border-brand-sand ${
                    currentView === 'list' 
                      ? 'bg-brand-terracotta hover:bg-brand-terracotta-dark text-white' 
                      : 'text-brand-stone hover:text-brand-navy hover:bg-brand-cream'
                  }`}
                  onClick={() => setCurrentView('list')}
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
                <Button 
                  variant={currentView === 'timeline' ? 'default' : 'ghost'} 
                  size="sm" 
                  className={`rounded-l-none ${
                    currentView === 'timeline' 
                      ? 'bg-brand-terracotta hover:bg-brand-terracotta-dark text-white' 
                      : 'text-brand-stone hover:text-brand-navy hover:bg-brand-cream'
                  }`}
                  onClick={() => setCurrentView('timeline')}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Timeline
                </Button>
              </div>
            </div>
          </div>
          
          <ProjectKanban projects={kanbanProjects} view={currentView} />
        </div>

        {/* Budget Transfer Section */}
        <div className="space-y-6 mt-8">
          <BudgetTransferWorkflow projects={budgetProjects} />
        </div>
      </div>
    </div>
  )
}