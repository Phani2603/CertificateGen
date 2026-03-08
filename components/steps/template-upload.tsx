"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface TemplateUploadProps {
  onUpload: (data: { image: string; s3Key?: string }) => void
  selectedEvent?: { club: string; eventId: string; eventName: string } | null
  organization?: { id: string; name: string; slug: string; logoUrl?: string } | null
}

interface ExistingTemplate {
  s3Key: string
  fileName: string
  signedUrl: string
  eventName: string
  eventId: string
}

export default function TemplateUpload({ onUpload, selectedEvent, organization }: TemplateUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [s3Key, setS3Key] = useState<string | null>(null)
  
  // Template reuse
  const [showReuse, setShowReuse] = useState(false)
  const [existingTemplates, setExistingTemplates] = useState<ExistingTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  console.log('[TemplateUpload] Props:', { selectedEvent, organization })

  // Load existing templates for reuse
  useEffect(() => {
    if (showReuse && organization?.id) {
      loadExistingTemplates()
    }
  }, [showReuse, organization?.id])

  const loadExistingTemplates = async () => {
    if (!organization?.id) return

    console.log('[TemplateUpload] Loading existing templates for org:', organization.id)
    setLoadingTemplates(true)
    
    try {
      const response = await fetch(`/api/templates/list?organizationId=${organization.id}`)
      const data = await response.json()
      
      console.log('[TemplateUpload] Loaded templates:', data)
      
      if (data.success && data.templates) {
        setExistingTemplates(data.templates)
        toast.success(`Found ${data.templates.length} existing templates`)
      } else {
        toast.info('No existing templates found')
      }
    } catch (error) {
      console.error('[TemplateUpload] Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleFile = useCallback((file: File) => {
    console.log('[TemplateUpload] File selected:', file.name, file.size, file.type)
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG or JPG)")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      setCurrentFile(file)
      console.log('[TemplateUpload] Preview generated')
    }
    reader.readAsDataURL(file)
  }, [])

  const uploadToS3 = async () => {
    if (!currentFile || !selectedEvent || !organization) {
      toast.error('Missing required information')
      return
    }

    console.log('[TemplateUpload] Starting S3 upload...')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', currentFile)
      formData.append('eventId', selectedEvent.eventId)
      formData.append('organizationId', organization.id)

      const response = await fetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      console.log('[TemplateUpload] Upload response:', data)

      if (data.success && data.s3Key) {
        setS3Key(data.s3Key)
        toast.success('Template uploaded to S3!')
        onUpload({ image: preview!, s3Key: data.s3Key })
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('[TemplateUpload] Upload error:', error)
      toast.error('Failed to upload template')
    } finally {
      setIsUploading(false)
    }
  }

  const selectExistingTemplate = (template: ExistingTemplate) => {
    console.log('[TemplateUpload] Selected existing template:', template)
    setPreview(template.signedUrl)
    setS3Key(template.s3Key)
    setShowReuse(false)
    toast.success('Template selected!')
    onUpload({ image: template.signedUrl, s3Key: template.s3Key })
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Step 1: Upload Certificate Template</h2>
      <p className="text-sm text-gray-600 mb-6">
        {organization?.id ? 'Upload new or reuse existing template' : 'Upload your certificate template'}
      </p>

      {/* Template Reuse Toggle */}
      {organization?.id && !preview && (
        <div className="mb-6 flex gap-3">
          <Button
            onClick={() => setShowReuse(false)}
            variant={!showReuse ? "default" : "outline"}
            className={!showReuse ? "bg-[#21808D] hover:bg-[#1a6570]" : ""}
          >
            Upload New
          </Button>
          <Button
            onClick={() => setShowReuse(true)}
            variant={showReuse ? "default" : "outline"}
            className={showReuse ? "bg-[#21808D] hover:bg-[#1a6570]" : ""}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reuse Existing
          </Button>
        </div>
      )}

      {/* Show reuse gallery */}
      {showReuse && organization?.id && (
        <div className="space-y-4">
          {loadingTemplates ? (
            <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-[#21808D]" />
              <span className="ml-3 text-gray-600">Loading templates...</span>
            </div>
          ) : existingTemplates.length === 0 ? (
            <div className="p-8 border-2 border-dashed rounded-lg text-center text-gray-600">
              <p>No existing templates found for your organization.</p>
              <Button
                onClick={() => setShowReuse(false)}
                variant="outline"
                className="mt-4"
              >
                Upload New Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {existingTemplates.map((template) => (
                <div
                  key={template.s3Key}
                  onClick={() => selectExistingTemplate(template)}
                  className="border-2 border-gray-300 rounded-lg p-3 cursor-pointer hover:border-[#21808D] transition-all"
                >
                  <img
                    src={template.signedUrl}
                    alt={template.eventName}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <p className="text-sm font-semibold truncate">{template.eventName}</p>
                  <p className="text-xs text-gray-500 truncate">{template.fileName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload new template */}
      {!showReuse && !preview && (
        <div
          onDragOver={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
            isDragging ? "border-[#21808D] bg-[#21808D]/5" : "border-gray-300 hover:border-[#21808D]"
          }`}
        >
          <Upload className="w-12 h-12 text-[#21808D] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Drag and drop your certificate template</h3>
          <p className="text-gray-600 mb-4">or click to browse</p>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleInputChange}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button asChild className="bg-[#21808D] hover:bg-[#1a6570] text-white">
              <span>Select File</span>
            </Button>
          </label>
          <p className="text-sm text-gray-500 mt-4">PNG or JPG, max 10MB</p>
        </div>
      )}
      
      {/* Preview and actions */}
      {!showReuse && preview && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 flex justify-center">
            <img src={preview || "/placeholder.svg"} alt="Certificate preview" className="max-h-96 object-contain" />
          </div>
          
          {s3Key && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="text-green-800">✅ Template saved to S3</p>
              <p className="text-green-600 text-xs mt-1 truncate">{s3Key}</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button 
              onClick={() => {
                setPreview(null)
                setCurrentFile(null)
                setS3Key(null)
              }} 
              variant="outline" 
              className="flex-1"
            >
              Change Template
            </Button>
            
            {!s3Key && selectedEvent && organization ? (
              <Button
                onClick={uploadToS3}
                disabled={isUploading}
                className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading to S3...
                  </>
                ) : (
                  'Upload & Continue'
                )}
              </Button>
            ) : !s3Key ? (
              <Button
                onClick={() => onUpload({ image: preview! })}
                className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
              >
                Continue (No Event Selected)
              </Button>
            ) : (
              <Button
                onClick={() => onUpload({ image: preview!, s3Key: s3Key })}
                className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white"
              >
                Next Step
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
