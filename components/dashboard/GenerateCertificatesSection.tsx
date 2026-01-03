"use client"

import { Card } from "@/components/ui/card"
import TemplateUpload from "@/components/steps/template-upload"
import FieldConfiguration from "@/components/steps/field-configuration"
import CertificateGeneration from "@/components/steps/certificate-generation"
import type { CertificateField } from "@/types/certificate"

type Step = "upload" | "configure" | "generate"

interface AppState {
  templateImage: string | null
  templateS3Key?: string // NEW: S3 key for template (optional, undefined if not set)
  fields: CertificateField[]
  csvData: Array<Record<string, string>>
}

interface GenerateCertificatesSectionProps {
  currentStep: Step
  setCurrentStep: (step: Step) => void
  appState: AppState
  setAppState: (state: AppState | ((prev: AppState) => AppState)) => void
  selectedEvent: {club: string, eventId: string, eventName: string} | null
  onAddToHistory: (eventName: string, clubName: string, count: number, totalSizeBytes: number) => void
  organization: {id: string, name: string, logoUrl?: string} | null
  clubs: Array<{id: string, name: string, members: number, color: string, logoUrl?: string}>
}

export function GenerateCertificatesSection({
  currentStep,
  setCurrentStep,
  appState,
  setAppState,
  selectedEvent,
  onAddToHistory,
  organization,
  clubs,
}: GenerateCertificatesSectionProps) {
  const handleTemplateUpload = (data: { image: string; s3Key?: string }) => {
    console.log('[GenerateCertificatesSection] Template uploaded:', data)
    setAppState((prev) => ({
      ...prev,
      templateImage: data.image,
      templateS3Key: data.s3Key || undefined, // Ensure it's undefined instead of falsy
    }))
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
    <div className="max-w-6xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex gap-4 mb-8">
        {(["upload", "configure", "generate"] as const).map((step, index) => (
          <div key={step} className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                currentStep === step
                  ? "bg-[#21808D] text-white"
                  : index < (currentStep === "upload" ? 0 : currentStep === "configure" ? 1 : 2)
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
        {currentStep === "upload" && (
          <TemplateUpload 
            onUpload={handleTemplateUpload}
            selectedEvent={selectedEvent}
            organization={organization}
          />
        )}
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
            templateS3Key={appState.templateS3Key}
            fields={appState.fields}
            onCsvUpload={handleCsvUpload}
            onBack={handleBack}
            selectedEvent={selectedEvent}
            onAddToHistory={onAddToHistory}
            organization={organization}
            clubs={clubs}
          />
        )}
      </Card>
    </div>
  )
}
