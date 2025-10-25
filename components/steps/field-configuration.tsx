"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"
import { CERTIFICATE_FONTS, FONT_WEIGHTS } from "@/lib/fonts"
import type { CertificateField } from "@/types/certificate"

interface FieldConfigurationProps {
  templateImage: string
  fields: CertificateField[]
  onFieldsUpdate: (fields: CertificateField[]) => void
  onNext: () => void
  onBack: () => void
}

export default function FieldConfiguration({
  templateImage,
  fields,
  onFieldsUpdate,
  onNext,
  onBack,
}: FieldConfigurationProps) {
  const [isAddingField, setIsAddingField] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fontFamilies = CERTIFICATE_FONTS.map((f) => f.family).join("|")
    const link = document.createElement("link")
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies.replace(/ /g, "+")}&display=swap`
    link.rel = "stylesheet"
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
    }
    img.src = templateImage
  }, [templateImage])

  useEffect(() => {
    if (!previewCanvasRef.current || !imageSize.width) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Draw demo text for each field
      fields.forEach((field) => {
        let demoText = "Demo Text"
        if (field.name === "Name") demoText = "John Smith"
        else if (field.name === "Date") demoText = new Date().toLocaleDateString()
        else if (field.name === "Course") demoText = "Certificate Course"

        const fontWeight = field.fontWeight === 400 ? "" : field.fontWeight
        const fontString = fontWeight
          ? `${fontWeight} ${field.fontSize}px "${field.fontFamily}"`
          : `${field.fontSize}px "${field.fontFamily}"`

        ctx.font = fontString
        ctx.fillStyle = field.color
        ctx.textAlign = field.alignment

        const x =
          field.alignment === "center" ? field.x : field.alignment === "right" ? field.x + field.maxWidth : field.x
        ctx.fillText(demoText, x, field.y, field.maxWidth)

        // Draw field marker
        ctx.fillStyle = "#21808D"
        ctx.fillRect(field.x - 5, field.y - 15, 10, 10)
      })
    }
    img.src = templateImage
  }, [fields, imageSize])

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAddingField) return

    const rect = previewCanvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newField: CertificateField = {
      id: Date.now().toString(),
      name: "Name",
      x: Math.round(x),
      y: Math.round(y),
      fontSize: 32,
      fontFamily: "Montserrat",
      fontWeight: 700,
      color: "#000000",
      alignment: "center",
      maxWidth: 300,
    }

    onFieldsUpdate([...fields, newField])
    setIsAddingField(false)
    setSelectedFieldId(newField.id)
  }

  const updateField = (id: string, updates: Partial<CertificateField>) => {
    onFieldsUpdate(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const deleteField = (id: string) => {
    onFieldsUpdate(fields.filter((f) => f.id !== id))
    setSelectedFieldId(null)
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId)
  const selectedFont = CERTIFICATE_FONTS.find((f) => f.family === selectedField?.fontFamily)
  const availableWeights = selectedFont?.weights || [400]

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Step 2: Configure Fields</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate Preview */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <canvas
              ref={previewCanvasRef}
              onClick={handleImageClick}
              className={`w-full h-auto ${isAddingField ? "cursor-crosshair" : "cursor-default"}`}
            />
          </div>

          <Button
            onClick={() => setIsAddingField(!isAddingField)}
            className={`mt-4 w-full ${
              isAddingField ? "bg-red-500 hover:bg-red-600" : "bg-[#21808D] hover:bg-[#1a6570]"
            } text-white`}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAddingField ? "Cancel" : "Add Field"}
          </Button>
        </div>

        {/* Field Properties Panel */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[#1a1a1a]">Fields</h3>

          {fields.length === 0 ? (
            <p className="text-gray-500 text-sm">No fields added yet. Click "Add Field" to start.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fields.map((field) => (
                <Card
                  key={field.id}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedFieldId === field.id ? "bg-[#21808D]/10 border-[#21808D]" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedFieldId(field.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-[#1a1a1a]">{field.name}</p>
                      <p className="text-xs text-gray-500">
                        x: {field.x}, y: {field.y}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteField(field.id)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {selectedField && (
            <Card className="p-4 bg-[#21808D]/5 border-[#21808D]">
              <h4 className="font-semibold text-[#1a1a1a] mb-4">Edit Field</h4>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Field Name</label>
                  <select
                    value={selectedField.name}
                    onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option>Name</option>
                    <option>Date</option>
                    <option>Course</option>
                    <option>Custom</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">X Position</label>
                    <input
                      type="number"
                      value={selectedField.x}
                      onChange={(e) => updateField(selectedField.id, { x: Number.parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Y Position</label>
                    <input
                      type="number"
                      value={selectedField.y}
                      onChange={(e) => updateField(selectedField.id, { y: Number.parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Font Family</label>
                  <select
                    value={selectedField.fontFamily}
                    onChange={(e) => {
                      const newFont = CERTIFICATE_FONTS.find((f) => f.family === e.target.value)
                      updateField(selectedField.id, {
                        fontFamily: e.target.value,
                        fontWeight: newFont?.weights[0] || 400,
                      })
                    }}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {["Serif", "Sans-Serif", "Script"].map((category) => (
                      <optgroup key={category} label={category}>
                        {CERTIFICATE_FONTS.filter((f) => f.category === category).map((font) => (
                          <option key={font.family} value={font.family}>
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Font Weight</label>
                  <select
                    value={selectedField.fontWeight}
                    onChange={(e) => updateField(selectedField.id, { fontWeight: Number.parseInt(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {availableWeights.map((weight) => (
                      <option key={weight} value={weight}>
                        {FONT_WEIGHTS[weight as keyof typeof FONT_WEIGHTS] || weight}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Font Size: {selectedField.fontSize}px</label>
                  <input
                    type="range"
                    min="16"
                    max="120"
                    value={selectedField.fontSize}
                    onChange={(e) => updateField(selectedField.id, { fontSize: Number.parseInt(e.target.value) })}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="color"
                    value={selectedField.color}
                    onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                    className="w-full mt-1 h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Alignment</label>
                  <div className="flex gap-2 mt-1">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateField(selectedField.id, { alignment: align })}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                          selectedField.alignment === align
                            ? "bg-[#21808D] text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Max Width: {selectedField.maxWidth}px</label>
                  <input
                    type="range"
                    min="100"
                    max="500"
                    value={selectedField.maxWidth}
                    onChange={(e) => updateField(selectedField.id, { maxWidth: Number.parseInt(e.target.value) })}
                    className="w-full mt-1"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={fields.length === 0}
          className="flex-1 bg-[#21808D] hover:bg-[#1a6570] text-white disabled:opacity-50"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
