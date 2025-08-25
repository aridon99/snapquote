import { createClient } from './server'
import { Profile, Project, Contractor, Message, BudgetItem, ProjectFile, IntakeForm } from '@/types/database'

export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export async function createUserProfile(profile: Partial<Profile>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()
  
  return { data, error }
}

export async function getProject(projectId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  
  return { data, error }
}

export async function getUserProjects(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('homeowner_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createProject(project: Partial<Project>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()
  
  return { data, error }
}

export async function getContractors(filters?: {
  specialties?: string[]
  serviceAreas?: string[]
  priceRange?: string
  availability?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('contractors')
    .select('*')
    .eq('is_active', true)
  
  if (filters?.specialties && filters.specialties.length > 0) {
    query = query.overlaps('specialties', filters.specialties)
  }
  
  if (filters?.serviceAreas && filters.serviceAreas.length > 0) {
    query = query.overlaps('service_areas', filters.serviceAreas)
  }
  
  if (filters?.priceRange) {
    query = query.eq('price_range', filters.priceRange)
  }
  
  if (filters?.availability) {
    query = query.eq('availability_status', filters.availability)
  }
  
  const { data, error } = await query.order('rating', { ascending: false })
  
  return { data, error }
}

export async function getProjectMessages(projectId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles(full_name, role)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  
  return { data, error }
}

export async function createMessage(message: Partial<Message>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single()
  
  return { data, error }
}

export async function getProjectBudget(projectId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createBudgetItem(item: Partial<BudgetItem>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('budget_items')
    .insert(item)
    .select()
    .single()
  
  return { data, error }
}

export async function getProjectFiles(projectId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function uploadProjectFile(file: File, projectId: string, userId: string, category: string) {
  const supabase = await createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${projectId}/${Date.now()}.${fileExt}`
  
  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(fileName, file)
  
  if (uploadError) return { data: null, error: uploadError }
  
  // Create file record
  const { data: publicUrl } = supabase.storage
    .from('project-files')
    .getPublicUrl(fileName)
  
  const { data, error } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,
      uploaded_by: userId,
      file_name: file.name,
      file_url: publicUrl.publicUrl,
      file_type: file.type,
      file_size: file.size,
      category: category as any
    })
    .select()
    .single()
  
  return { data, error }
}