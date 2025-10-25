"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface TemplateUploadProps {
  onUpload: (image: string) => void
}

export default function TemplateUpload({ onUpload }: TemplateUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG or JPG)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
    }
    reader.readAsDataURL(file)
  }, [])

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
      <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Step 1: Upload Certificate Template</h2>

      {!preview ? (
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
          <p className="text-sm text-gray-500 mt-4">PNG or JPG, max 5MB</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 flex justify-center">
            <img src={preview || "/placeholder.svg"} alt="Certificate preview" className="max-h-96 object-contain" />
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setPreview(null)} variant="outline" className="flex-1">
              Change Template
            </Button>
            <Button onClick={() => onUpload(preview)} className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white">
              Next Step
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
