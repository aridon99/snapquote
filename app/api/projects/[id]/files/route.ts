import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const projectId = params.id
    
    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check if user is homeowner or contractor on this project
    const isHomeowner = project.homeowner_id === user.id
    let isContractor = false
    
    if (!isHomeowner) {
      const { data: contractorAccess } = await supabase
        .from('project_contractors')
        .select('contractor_id')
        .eq('project_id', projectId)
        .eq('contractor_id', user.id)
        .single()
      
      isContractor = !!contractorAccess
    }
    
    if (!isHomeowner && !isContractor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get project files
    const { data: files, error } = await supabase
      .from('project_files')
      .select(`
        *,
        uploader:profiles!project_files_uploaded_by_fkey(
          id,
          full_name,
          role
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ files })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project files' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const projectId = params.id
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const description = formData.get('description') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!category) {
      return NextResponse.json({ error: 'File category is required' }, { status: 400 })
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 })
    }
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('homeowner_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Check if user is homeowner or contractor on this project
    const isHomeowner = project.homeowner_id === user.id
    let isContractor = false
    
    if (!isHomeowner) {
      const { data: contractorAccess } = await supabase
        .from('project_contractors')
        .select('contractor_id')
        .eq('project_id', projectId)
        .eq('contractor_id', user.id)
        .single()
      
      isContractor = !!contractorAccess
    }
    
    if (!isHomeowner && !isContractor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${projectId}/${timestamp}-${crypto.randomUUID()}.${fileExt}`
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileName)
    
    // Save file record to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        uploaded_by: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        category: category as any,
        description: description || null
      })
      .select(`
        *,
        uploader:profiles!project_files_uploaded_by_fkey(
          id,
          full_name,
          role
        )
      `)
      .single()
    
    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('project-files').remove([fileName])
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
    }
    
    return NextResponse.json({
      message: 'File uploaded successfully',
      file: fileRecord
    })
    
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }
    
    // Get file record and verify permissions
    const { data: file, error: fileError } = await supabase
      .from('project_files')
      .select('*, project:projects!project_files_project_id_fkey(homeowner_id)')
      .eq('id', fileId)
      .eq('project_id', projectId)
      .single()
    
    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Check permissions - user must be file uploader or project owner
    const isFileOwner = file.uploaded_by === user.id
    const isProjectOwner = file.project.homeowner_id === user.id
    
    if (!isFileOwner && !isProjectOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Extract file path from URL for deletion
    const url = new URL(file.file_url)
    const filePath = url.pathname.split('/').slice(-2).join('/') // Get project_id/filename
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([filePath])
    
    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('project_files')
      .delete()
      .eq('id', fileId)
    
    if (dbError) {
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'File deleted successfully' })
    
  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}