'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, File, Image, FileText, X, Download, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { ProjectFile } from '@/types/database'
import { formatFileSize } from '@/lib/utils/validation'
import { formatDateRelative } from '@/lib/utils/date'

interface FileUploadProps {
  projectId: string
  onFileUploaded?: (file: ProjectFile) => void
}

interface ProjectFileWithUploader extends ProjectFile {
  uploader: {
    id: string
    full_name: string | null
    role: string
  }
}

const FILE_CATEGORIES = [
  { value: 'photo', label: 'Photo', icon: Image },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'permit', label: 'Permit', icon: File },
  { value: 'warranty', label: 'Warranty', icon: File },
  { value: 'receipt', label: 'Receipt', icon: File },
  { value: 'other', label: 'Other', icon: File }
]

export function FileUpload({ projectId, onFileUploaded }: FileUploadProps) {
  const [files, setFiles] = useState<ProjectFileWithUploader[]>([])
  const [loading, setLoading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [category, setCategory] = useState<string>('photo')
  const [description, setDescription] = useState('')

  // Load files on component mount
  useState(() => {
    loadFiles()
  })

  const loadFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`)
      if (!response.ok) throw new Error('Failed to fetch files')
      
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Failed to load files')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadFiles(acceptedFiles)
    setShowUploadDialog(true)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return

    setLoading(true)
    const uploadPromises = uploadFiles.map(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      formData.append('description', description)

      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`)
      }

      return response.json()
    })

    try {
      const results = await Promise.all(uploadPromises)
      
      // Add uploaded files to the list
      const newFiles = results.map(result => result.file)
      setFiles(prev => [...newFiles, ...prev])
      
      toast.success(`${uploadFiles.length} file(s) uploaded successfully`)
      
      // Notify parent
      if (onFileUploaded) {
        newFiles.forEach(file => onFileUploaded(file))
      }
      
      // Reset form
      setUploadFiles([])
      setDescription('')
      setShowUploadDialog(false)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload some files')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/files?fileId=${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete file')

      setFiles(prev => prev.filter(f => f.id !== fileId))
      toast.success('File deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete file')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image
    if (fileType === 'application/pdf') return FileText
    return File
  }

  const getCategoryIcon = (categoryValue: string) => {
    const category = FILE_CATEGORIES.find(cat => cat.value === categoryValue)
    return category?.icon || File
  }

  const getCategoryLabel = (categoryValue: string) => {
    const category = FILE_CATEGORIES.find(cat => cat.value === categoryValue)
    return category?.label || 'Other'
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Files</span>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Project Files</DialogTitle>
                  <DialogDescription>
                    Upload photos, documents, or other files related to your project
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* File Category */}
                  <div>
                    <Label htmlFor="category">File Category</Label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background"
                    >
                      {FILE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the files..."
                      className="mt-1"
                    />
                  </div>

                  {/* Drag and Drop */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    {isDragActive ? (
                      <p className="text-blue-600">Drop the files here...</p>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-2">
                          Drag & drop files here, or click to select
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports: Images, PDF, DOC, TXT (max 10MB each)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selected Files Preview */}
                  {uploadFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Files ({uploadFiles.length})</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {uploadFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploadFiles.length === 0 || loading}
                  >
                    {loading ? 'Uploading...' : `Upload ${uploadFiles.length} File(s)`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No files uploaded yet</p>
              <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First File
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.file_type || '')
                const CategoryIcon = getCategoryIcon(file.category)
                
                return (
                  <Card key={file.id} className="relative group">
                    <CardContent className="p-4">
                      {/* File Preview */}
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                        {file.file_type?.startsWith('image/') ? (
                          <img
                            src={file.file_url}
                            alt={file.file_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FileIcon className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {getCategoryLabel(file.category)}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-sm truncate" title={file.file_name}>
                          {file.file_name}
                        </h4>
                        
                        {file.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          <div>Size: {formatFileSize(file.file_size || 0)}</div>
                          <div>Uploaded: {formatDateRelative(file.created_at)}</div>
                          <div>By: {file.uploader.full_name || 'Unknown'}</div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDelete(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}