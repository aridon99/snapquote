'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  FileText,
  Home,
  Hammer
} from 'lucide-react'
import Link from 'next/link'

export default function AdvisorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
              <p className="text-gray-600">Manage all renovation projects and contractors</p>
            </div>
            <div className="flex gap-2">
              <Link href="/advisor/punch-lists">
                <Button variant="outline">
                  <Hammer className="w-4 h-4 mr-2" />
                  Punch Lists
                </Button>
              </Link>
              <Link href="/intake">
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                of 15 total
              </p>
              <Progress value={80} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$245K</div>
              <p className="text-xs text-muted-foreground">
                $20K/month avg
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-muted-foreground">On-time delivery</p>
              <Progress value={95} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
              <div className="flex mt-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < 5 ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Pending Approvals</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <Button variant="link" className="p-0 text-yellow-600">
                Review now →
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Upcoming Meetings</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">5</div>
              <Button variant="link" className="p-0 text-blue-600">
                View calendar →
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Overdue Tasks</CardTitle>
                <Clock className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">2</div>
              <Button variant="link" className="p-0 text-red-600">
                Address now →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sample Active Project */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Active Projects</h2>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      KIT-24-JH-001
                    </Badge>
                    <CardTitle className="text-lg">Kitchen Renovation</CardTitle>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        John Huang
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        john@email.com
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <Badge variant="default">
                  in progress
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>65%</span>
                </div>
                <Progress value={65} />
              </div>

              {/* Budget Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Budget Used</span>
                  <span>$28,000 / $45,000</span>
                </div>
                <Progress value={62} />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Issues</div>
                  <div className="text-lg font-semibold text-yellow-600">2</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Unread</div>
                  <div className="text-lg font-semibold text-blue-600">3</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Last Activity</div>
                  <div className="text-sm">2 hours ago</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href="/projects/1" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Link href="/projects/1/messages" className="flex-1">
                  <Button size="sm" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}