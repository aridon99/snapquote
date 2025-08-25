'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Milestone {
  label: string
  value: number
  completed: boolean
  date?: string
}

interface EnhancedProgressProps {
  value: number
  milestones?: Milestone[]
  className?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'default' | 'success' | 'warning' | 'danger'
}

export function EnhancedProgress({ 
  value, 
  milestones = [], 
  className,
  showPercentage = true,
  size = 'md',
  color = 'default'
}: EnhancedProgressProps) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const colorClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  }

  return (
    <div className={cn('relative mb-8', className)}>
      {/* Progress Bar */}
      <div className="relative">
        <Progress 
          value={value} 
          className={cn(sizeClasses[size])}
        />
        
        {/* Custom colored fill */}
        <div 
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-500',
            colorClasses[color]
          )}
          style={{ width: `${Math.min(value, 100)}%` }}
        />

        {/* Milestone Markers */}
        {milestones.map((milestone, index) => (
          <div
            key={index}
            className="absolute top-0 transform -translate-x-1/2"
            style={{ left: `${milestone.value}%` }}
          >
            {/* Milestone Tick Mark */}
            <div 
              className={cn(
                'w-0.5 bg-white border-2 transition-all duration-300',
                sizeClasses[size],
                milestone.completed 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-400 bg-gray-400'
              )}
            />
            
            {/* Milestone Label */}
            <div className="absolute top-full mt-1 transform -translate-x-1/2 min-w-max z-10">
              <div className={cn(
                'text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap text-center max-w-[60px] truncate',
                milestone.completed 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              )}>
                {milestone.label}
                {milestone.date && (
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {milestone.date}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Percentage Display */}
      {showPercentage && (
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(value)}%</span>
        </div>
      )}
    </div>
  )
}

// Budget utilization gauge component
interface BudgetGaugeProps {
  allocated: number
  spent: number
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  className?: string
}

export function BudgetGauge({ 
  allocated, 
  spent, 
  currency = '$',
  size = 'md',
  showDetails = true,
  className 
}: BudgetGaugeProps) {
  const percentage = (spent / allocated) * 100
  const remaining = allocated - spent
  
  // Determine color based on usage
  const getColor = () => {
    if (percentage >= 95) return 'danger'
    if (percentage >= 80) return 'warning'
    return 'success'
  }

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3', 
    lg: 'h-4'
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Budget Bar */}
      <div className="relative">
        <div className={cn('bg-gray-200 rounded-full', sizeClasses[size])}>
          <div 
            className={cn(
              'h-full rounded-full transition-all duration-500',
              getColor() === 'danger' && 'bg-red-500',
              getColor() === 'warning' && 'bg-yellow-500',
              getColor() === 'success' && 'bg-green-500'
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Over-budget indicator */}
        {percentage > 100 && (
          <div className="absolute top-0 right-0 h-full">
            <div className="bg-red-600 h-full w-2 rounded-r-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Budget Details */}
      {showDetails && (
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-muted-foreground">Spent: </span>
            <span className="font-medium">
              {currency}{spent.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">
              {percentage > 100 ? 'Over: ' : 'Remaining: '}
            </span>
            <span className={cn(
              'font-medium',
              percentage > 100 ? 'text-red-600' : 'text-green-600'
            )}>
              {currency}{Math.abs(remaining).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Percentage indicator */}
      <div className="text-center">
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          getColor() === 'danger' && 'bg-red-100 text-red-800',
          getColor() === 'warning' && 'bg-yellow-100 text-yellow-800',
          getColor() === 'success' && 'bg-green-100 text-green-800'
        )}>
          {Math.round(percentage)}% utilized
        </span>
      </div>
    </div>
  )
}

// Status indicator component
interface StatusIndicatorProps {
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'delayed'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = true, 
  className 
}: StatusIndicatorProps) {
  const statusConfig = {
    planning: {
      color: 'bg-blue-500',
      textColor: 'text-blue-800',
      bgColor: 'bg-blue-100',
      label: 'Planning',
      icon: '📋'
    },
    in_progress: {
      color: 'bg-green-500',
      textColor: 'text-green-800',
      bgColor: 'bg-green-100',
      label: 'In Progress',
      icon: '🔨'
    },
    on_hold: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-800',
      bgColor: 'bg-yellow-100',
      label: 'On Hold',
      icon: '⏸️'
    },
    completed: {
      color: 'bg-green-600',
      textColor: 'text-green-800',
      bgColor: 'bg-green-100',
      label: 'Completed',
      icon: '✅'
    },
    delayed: {
      color: 'bg-red-500',
      textColor: 'text-red-800',
      bgColor: 'bg-red-100',
      label: 'Delayed',
      icon: '⚠️'
    }
  }

  const config = statusConfig[status]
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Status dot */}
      <div className={cn('rounded-full', config.color, sizeClasses[size])} />
      
      {/* Status label */}
      {showLabel && (
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full',
          config.textColor,
          config.bgColor
        )}>
          {config.icon} {config.label}
        </span>
      )}
    </div>
  )
}