'use client'

import React, { useState } from 'react'
import { useProjectContext } from '@/lib/providers/project-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
//   CommandSeparator,
// } from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  ChevronDown, 
  Search, 
  Home, 
  Clock, 
  Users,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getShortReferenceCode, formatProjectType } from '@/lib/utils/project-reference'
import { cn } from '@/lib/utils'

interface ProjectSwitcherProps {
  userRole: 'owner' | 'advisor' | 'contractor'
  className?: string
}

export function ProjectSwitcher({ userRole, className }: ProjectSwitcherProps) {
  const {
    currentProject,
    allProjects,
    recentProjects,
    activeSessions,
    switchToProject,
    navigateToProject,
    isLoading
  } = useProjectContext()

  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case 'in_progress':
        return <Play className="h-3 w-3 text-blue-500" />
      case 'on_hold':
        return <Pause className="h-3 w-3 text-yellow-500" />
      default:
        return <AlertCircle className="h-3 w-3 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'planning': return 'bg-purple-100 text-purple-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleProjectSelect = async (projectId: string) => {
    try {
      await switchToProject(projectId)
      setOpen(false)
    } catch (error) {
      console.error('Error switching project:', error)
    }
  }

  const activeProjects = allProjects.filter(p => p.status !== 'completed')
  const completedProjects = allProjects.filter(p => p.status === 'completed')

  return (
    <>
      {/* Main Project Switcher */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between min-w-[200px]", className)}
          >
            {currentProject ? (
              <div className="flex items-center gap-2">
                {getStatusIcon(currentProject.status)}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {currentProject.reference_code || getShortReferenceCode(currentProject.title)}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {currentProject.title}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select project...</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Projects</div>
            {allProjects.length === 0 ? (
              <div className="text-sm text-muted-foreground">No projects found</div>
            ) : (
              <div className="space-y-1">
                {allProjects.slice(0, 5).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className="w-full text-left p-2 hover:bg-accent rounded-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(project.status)}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {project.reference_code || getShortReferenceCode(project.title)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {project.title}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setDetailsOpen(true)}
              className="w-full text-left p-2 hover:bg-accent rounded-sm flex items-center gap-2 text-sm"
            >
              <Search className="h-4 w-4" />
              View all projects...
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Detailed Project Browser Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>All Projects</DialogTitle>
            <DialogDescription>
              Browse and switch between all your projects
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              {allProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        handleProjectSelect(project.id)
                        setDetailsOpen(false)
                      }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(project.status)}
                        <div>
                          <CardTitle className="text-lg">
                            {project.reference_code || getShortReferenceCode(project.title)}
                          </CardTitle>
                          <CardDescription>{project.title}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Role-based navigation buttons */}
                        {userRole === 'advisor' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToProject(project.id, 'owner')
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Owner View
                          </Button>
                        )}
                        {userRole === 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToProject(project.id, 'advisor')
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Advisor View
                          </Button>
                        )}
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium">{formatProjectType(project.project_type)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Budget:</span>
                        <p className="font-medium">{project.budget_range || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <p className="font-medium">
                          {project.address?.city}, {project.address?.state}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Activity:</span>
                        <p className="font-medium">
                          {project.last_viewed_at 
                            ? formatDistanceToNow(new Date(project.last_viewed_at), { addSuffix: true })
                            : formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })
                          }
                        </p>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    {activeSessions.filter(s => s.project_id === project.id).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Currently viewing:</span>
                          {activeSessions
                            .filter(s => s.project_id === project.id)
                            .map(session => (
                              <Badge key={session.id} variant="outline" className="text-xs">
                                {session.user_role}
                              </Badge>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}