"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Trash2 } from "lucide-react"
import TemplateUpload from "@/components/steps/template-upload"
import FieldConfiguration from "@/components/steps/field-configuration"
import CertificateGeneration from "@/components/steps/certificate-generation"
import type { CertificateField } from "@/types/certificate"
import { saveSession, loadSession, clearSession, hasValidSession } from "@/utils/storage"

type Step = "upload" | "configure" | "generate"

interface AppState {
  templateImage: string | null
  fields: CertificateField[]
  csvData: Array<Record<string, string>>
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>("upload")
  const [appState, setAppState] = useState<AppState>({
    templateImage: null,
    fields: [],
    csvData: [],
  })
  const [sessionRestored, setSessionRestored] = useState(false)

  // Restore session on mount
  useEffect(() => {
    if (hasValidSession()) {
      const session = loadSession()
      console.log("[Session] Restoring session from localStorage:", session)

      const restoredState: AppState = {
        templateImage: session.templateImage || null,
        fields: session.fields || [],
        csvData: session.csvData || [],
      }

      setAppState(restoredState)

      // Restore current step
      if (session.currentStep === 1) setCurrentStep("upload")
      else if (session.currentStep === 2) setCurrentStep("configure")
      else if (session.currentStep === 3) setCurrentStep("generate")

      setSessionRestored(true)

      // Auto-clear the session restored message after 5 seconds
      setTimeout(() => setSessionRestored(false), 5000)
    }
  }, [])

  // Save session whenever important data changes
  useEffect(() => {
    const stepNumber =
      currentStep === "upload" ? 1 : currentStep === "configure" ? 2 : 3

    const sessionData = {
      currentStep: stepNumber,
      templateImage: appState.templateImage || "",
      fields: appState.fields,
      csvData: appState.csvData,
    }

    saveSession(sessionData)
  }, [currentStep, appState])

  const handleClearSession = () => {
    if (confirm("Are you sure you want to clear all progress and start fresh?")) {
      clearSession()
      window.location.reload()
    }
  }

  const handleTemplateUpload = (image: string) => {
    setAppState((prev) => ({ ...prev, templateImage: image }))
    setCurrentStep("configure")
  }

  const handleFieldsUpdate = (fields: CertificateField[]) => {
    setAppState((prev) => ({ ...prev, fields }))
  }

  const handleCsvUpload = (data: Array<Record<string, string>>) => {
    setAppState((prev) => ({ ...prev, csvData: data }))
  }

  const handleBack = () => {
    if (currentStep === "configure") setCurrentStep("upload")
    if (currentStep === "generate") setCurrentStep("configure")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFCF9] to-[#F5F5F2] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#1a1a1a] mb-2">Certificate Generator</h1>
              <p className="text-gray-600">Create professional certificates in bulk with ease</p>
            </div>
            <div className="flex items-center gap-4">
              {sessionRestored && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md border border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  Session restored
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSession}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Session
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-4 mb-8">
          {(["upload", "configure", "generate"] as const).map((step, index) => (
            <div key={step} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep === step
                    ? "bg-[#21808D] text-white"
                    : currentStep > step
                      ? "bg-[#21808D] text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </div>
              <span className="font-medium text-gray-700 hidden sm:inline">
                {step === "upload" && "Upload Template"}
                {step === "configure" && "Configure Fields"}
                {step === "generate" && "Generate"}
              </span>
              {index < 2 && <div className="w-8 h-0.5 bg-gray-300 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="bg-white shadow-lg">
          {currentStep === "upload" && <TemplateUpload onUpload={handleTemplateUpload} />}
          {currentStep === "configure" && appState.templateImage && (
            <FieldConfiguration
              templateImage={appState.templateImage}
              fields={appState.fields}
              onFieldsUpdate={handleFieldsUpdate}
              onNext={() => setCurrentStep("generate")}
              onBack={handleBack}
            />
          )}
          {currentStep === "generate" && (
            <CertificateGeneration
              templateImage={appState.templateImage!}
              fields={appState.fields}
              onCsvUpload={handleCsvUpload}
              onBack={handleBack}
            />
          )}
        </Card>
      </div>
    </main>
  )
}
