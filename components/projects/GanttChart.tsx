'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ZoomIn, ZoomOut } from 'lucide-react'
import { format, differenceInDays, startOfWeek, endOfWeek, eachWeekOfInterval, addDays } from 'date-fns'
import { Milestone } from '@/components/projects/ProjectTimeline'

interface GanttChartProps {
  milestones: Milestone[]
  startDate?: string
  endDate?: string
  className?: string
}

export function GanttChart({ milestones, startDate, endDate, className }: GanttChartProps) {
  const { chartData, dateRange, totalDays } = useMemo(() => {
    if (milestones.length === 0) {
      return { chartData: [], dateRange: { start: new Date(), end: new Date() }, totalDays: 0 }
    }

    // Calculate date range
    const allDates = milestones.map(m => new Date(m.dueDate))
    const minDate = startDate ? new Date(startDate) : new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = endDate ? new Date(endDate) : new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // Add padding
    const start = startOfWeek(addDays(minDate, -7))
    const end = endOfWeek(addDays(maxDate, 14))
    const days = differenceInDays(end, start)

    // Generate chart data
    const chartData = milestones.map(milestone => {
      const dueDate = new Date(milestone.dueDate)
      const dayFromStart = differenceInDays(dueDate, start)
      const position = (dayFromStart / days) * 100

      return {
        ...milestone,
        position,
        dayFromStart
      }
    })

    return {
      chartData,
      dateRange: { start, end },
      totalDays: days
    }
  }, [milestones, startDate, endDate])

  const weeks = useMemo(() => {
    return eachWeekOfInterval({
      start: dateRange.start,
      end: dateRange.end
    })
  }, [dateRange])

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'overdue':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getTypeColor = (type: Milestone['type']) => {
    switch (type) {
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'permits':
        return 'bg-purple-100 text-purple-800'
      case 'construction':
        return 'bg-orange-100 text-orange-800'
      case 'inspection':
        return 'bg-green-100 text-green-800'
      case 'payment':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (milestones.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Project Gantt Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No milestones to display</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Project Gantt Chart
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <ZoomOut className="w-4 h-4 mr-2" />
              Zoom Out
            </Button>
            <Button variant="outline" size="sm">
              <ZoomIn className="w-4 h-4 mr-2" />
              Zoom In
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline Header */}
          <div className="overflow-x-auto">
            <div className="relative min-w-[800px]">
              {/* Week Headers */}
              <div className="flex border-b border-gray-200 pb-2 mb-4">
                <div className="w-64 flex-shrink-0" /> {/* Spacer for milestone names */}
                <div className="flex-1 relative">
                  <div className="flex">
                    {weeks.map((week, index) => (
                      <div
                        key={index}
                        className="flex-1 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0 py-2"
                        style={{ minWidth: `${100 / weeks.length}%` }}
                      >
                        {format(week, 'MMM d')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gantt Rows */}
              <div className="space-y-2">
                {chartData.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-center">
                    {/* Milestone Info */}
                    <div className="w-64 flex-shrink-0 pr-4">
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {milestone.title}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(milestone.type)} variant="secondary">
                            {milestone.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(milestone.dueDate), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative h-8 bg-gray-50 rounded border">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex">
                        {weeks.map((_, index) => (
                          <div
                            key={index}
                            className="border-r border-gray-200 last:border-r-0"
                            style={{ width: `${100 / weeks.length}%` }}
                          />
                        ))}
                      </div>

                      {/* Milestone Marker */}
                      <div
                        className={`absolute top-1 bottom-1 w-3 rounded ${getStatusColor(milestone.status)}`}
                        style={{
                          left: `${Math.max(0, Math.min(100, milestone.position))}%`,
                          transform: 'translateX(-50%)'
                        }}
                        title={`${milestone.title} - ${format(new Date(milestone.dueDate), 'MMM d, yyyy')}`}
                      />

                      {/* Dependencies Lines */}
                      {milestone.dependencies?.map((depId) => {
                        const dependency = chartData.find(m => m.id === depId)
                        if (!dependency) return null

                        return (
                          <svg
                            key={depId}
                            className="absolute inset-0 pointer-events-none"
                            style={{ zIndex: 1 }}
                          >
                            <line
                              x1={`${dependency.position}%`}
                              y1="50%"
                              x2={`${milestone.position}%`}
                              y2="50%"
                              stroke="#6b7280"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                              markerEnd="url(#arrowhead)"
                            />
                          </svg>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Today Indicator */}
              <div className="absolute top-0 bottom-0 pointer-events-none">
                {(() => {
                  const today = new Date()
                  const dayFromStart = differenceInDays(today, dateRange.start)
                  const todayPosition = (dayFromStart / totalDays) * 100

                  if (todayPosition >= 0 && todayPosition <= 100) {
                    return (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `calc(256px + ${todayPosition}%)` }}
                      >
                        <div className="absolute -top-6 -left-8 text-xs text-red-600 font-medium">
                          Today
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-xs text-gray-600">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-xs text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded" />
              <span className="text-xs text-gray-600">Upcoming</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span className="text-xs text-gray-600">Overdue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-0.5 h-3 bg-red-500" />
              <span className="text-xs text-gray-600">Today</span>
            </div>
          </div>
        </div>

        {/* SVG Definitions for Arrow Markers */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
          </defs>
        </svg>
      </CardContent>
    </Card>
  )
}