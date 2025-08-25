'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export interface Milestone {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue'
  type: 'planning' | 'permits' | 'construction' | 'inspection' | 'payment'
  amount?: number
  assignedTo?: string
  completedDate?: string
  dependencies?: string[]
}

interface ProjectTimelineProps {
  projectId: string
  milestones?: Milestone[]
  onMilestoneUpdate?: (milestone: Milestone) => void
  onMilestoneDelete?: (id: string) => void
  canEdit?: boolean
}

const MILESTONE_TYPES = [
  { value: 'planning', label: 'Planning', color: 'bg-blue-100 text-blue-800' },
  { value: 'permits', label: 'Permits', color: 'bg-purple-100 text-purple-800' },
  { value: 'construction', label: 'Construction', color: 'bg-orange-100 text-orange-800' },
  { value: 'inspection', label: 'Inspection', color: 'bg-green-100 text-green-800' },
  { value: 'payment', label: 'Payment', color: 'bg-yellow-100 text-yellow-800' }
]

const STATUS_COLORS = {
  upcoming: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
}

const STATUS_ICONS = {
  upcoming: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle2,
  overdue: AlertCircle
}

export function ProjectTimeline({ 
  projectId, 
  milestones = [],
  onMilestoneUpdate,
  onMilestoneDelete,
  canEdit = false
}: ProjectTimelineProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    type: 'planning' as Milestone['type'],
    amount: '',
    assignedTo: ''
  })

  // Mock milestones for demonstration
  const mockMilestones: Milestone[] = [
    {
      id: '1',
      title: 'Initial Planning & Design',
      description: 'Complete initial project planning, design consultation, and material selection',
      dueDate: '2024-09-01',
      status: 'completed',
      type: 'planning',
      completedDate: '2024-08-28',
      assignedTo: 'Design Team'
    },
    {
      id: '2',
      title: 'Permits & Approvals',
      description: 'Obtain all necessary permits and city approvals for construction',
      dueDate: '2024-09-15',
      status: 'completed',
      type: 'permits',
      completedDate: '2024-09-10'
    },
    {
      id: '3',
      title: 'Initial Payment (25%)',
      description: 'First milestone payment for project kickoff',
      dueDate: '2024-09-20',
      status: 'completed',
      type: 'payment',
      amount: 18750,
      completedDate: '2024-09-18'
    },
    {
      id: '4',
      title: 'Demolition & Site Prep',
      description: 'Remove existing fixtures, prepare workspace, and protect surrounding areas',
      dueDate: '2024-09-30',
      status: 'in_progress',
      type: 'construction',
      assignedTo: 'Construction Crew'
    },
    {
      id: '5',
      title: 'Rough-in Work',
      description: 'Complete electrical, plumbing, and HVAC rough-in work',
      dueDate: '2024-10-15',
      status: 'upcoming',
      type: 'construction',
      assignedTo: 'Subcontractors'
    },
    {
      id: '6',
      title: 'Inspection - Rough-in',
      description: 'City inspection of electrical, plumbing, and HVAC work',
      dueDate: '2024-10-20',
      status: 'upcoming',
      type: 'inspection',
      dependencies: ['5']
    },
    {
      id: '7',
      title: 'Progress Payment (50%)',
      description: 'Second milestone payment after rough-in completion',
      dueDate: '2024-10-25',
      status: 'upcoming',
      type: 'payment',
      amount: 37500,
      dependencies: ['6']
    },
    {
      id: '8',
      title: 'Finish Work',
      description: 'Install cabinets, countertops, flooring, and finish carpentry',
      dueDate: '2024-11-15',
      status: 'upcoming',
      type: 'construction',
      assignedTo: 'Finish Crew'
    },
    {
      id: '9',
      title: 'Final Inspection',
      description: 'Final city inspection and certificate of completion',
      dueDate: '2024-11-25',
      status: 'upcoming',
      type: 'inspection',
      dependencies: ['8']
    },
    {
      id: '10',
      title: 'Final Payment (25%)',
      description: 'Final payment upon project completion and approval',
      dueDate: '2024-11-30',
      status: 'upcoming',
      type: 'payment',
      amount: 18750,
      dependencies: ['9']
    }
  ]

  const displayMilestones = milestones.length > 0 ? milestones : mockMilestones

  const getStatusIcon = (status: Milestone['status']) => {
    const Icon = STATUS_ICONS[status]
    return <Icon className="w-4 h-4" />
  }

  const getTypeColor = (type: Milestone['type']) => {
    return MILESTONE_TYPES.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-800'
  }

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setFormData({
      title: milestone.title,
      description: milestone.description,
      dueDate: milestone.dueDate,
      type: milestone.type,
      amount: milestone.amount?.toString() || '',
      assignedTo: milestone.assignedTo || ''
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    const milestone: Milestone = {
      id: editingMilestone?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      dueDate: formData.dueDate,
      type: formData.type,
      status: editingMilestone?.status || 'upcoming',
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      assignedTo: formData.assignedTo || undefined,
      completedDate: editingMilestone?.completedDate
    }

    onMilestoneUpdate?.(milestone)
    setIsDialogOpen(false)
    setEditingMilestone(null)
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      type: 'planning',
      amount: '',
      assignedTo: ''
    })
  }

  const getProgressPercentage = () => {
    const completed = displayMilestones.filter(m => m.status === 'completed').length
    return Math.round((completed / displayMilestones.length) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Project Timeline
            </CardTitle>
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Milestone title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Milestone description"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select value={formData.type} onValueChange={(value: Milestone['type']) => setFormData({ ...formData, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MILESTONE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount (if payment)</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="assignedTo">Assigned To</Label>
                        <Input
                          id="assignedTo"
                          value={formData.assignedTo}
                          onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                          placeholder="Person or team"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit}>
                        {editingMilestone ? 'Update' : 'Add'} Milestone
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-500">{getProgressPercentage()}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {displayMilestones.filter(m => m.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {displayMilestones.filter(m => m.status === 'in_progress').length}
                </div>
                <div className="text-xs text-gray-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-600">
                  {displayMilestones.filter(m => m.status === 'upcoming').length}
                </div>
                <div className="text-xs text-gray-500">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {displayMilestones.filter(m => m.status === 'overdue').length}
                </div>
                <div className="text-xs text-gray-500">Overdue</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayMilestones.map((milestone, index) => (
              <div key={milestone.id} className="relative">
                {/* Timeline line */}
                {index < displayMilestones.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Status indicator */}
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 
                    ${milestone.status === 'completed' 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : milestone.status === 'in_progress'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : milestone.status === 'overdue'
                      ? 'bg-red-100 border-red-500 text-red-700'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                    }
                  `}>
                    {getStatusIcon(milestone.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                            <Badge className={getTypeColor(milestone.type)}>
                              {MILESTONE_TYPES.find(t => t.value === milestone.type)?.label}
                            </Badge>
                            <Badge className={STATUS_COLORS[milestone.status]}>
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                            </div>
                            
                            {milestone.completedDate && (
                              <div className="flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Completed: {format(new Date(milestone.completedDate), 'MMM d, yyyy')}
                              </div>
                            )}
                            
                            {milestone.amount && (
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                ${milestone.amount.toLocaleString()}
                              </div>
                            )}
                            
                            {milestone.assignedTo && (
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {milestone.assignedTo}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {canEdit && (
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(milestone)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onMilestoneDelete?.(milestone.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}