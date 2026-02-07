"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Eye, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface Certificate {
  _id: string
  verificationId: string
  recipientName: string
  recipientEmail: string
  eventName: string
  issuedDate: string
  templateS3Key?: string
  fieldConfiguration?: any[]
  eventId?: string
  organizationName?: string
  privateOrgName?: string
}

export function MyCertificatesTable() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchCertificates()
  }, [])

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/my-certificates')
      const data = await response.json()

      if (data.success) {
        setCertificates(data.certificates || [])
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : certificates.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < certificates.length - 1 ? prev + 1 : 0))
  }

  const handleViewCertificate = (cert: Certificate) => {
    // Open certificate verification page in new tab
    window.open(`/verify/${cert.verificationId}`, '_blank')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">My Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Loading certificates...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (certificates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">My Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Award className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No certificates yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your earned certificates will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentCert = certificates[currentIndex]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">My Certificates</CardTitle>
        {certificates.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} of {certificates.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handlePrevious}
                disabled={certificates.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleNext}
                disabled={certificates.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-muted/50 rounded-t-lg border-b text-xs font-medium text-muted-foreground">
          <div className="col-span-5">Event/Certificate</div>
          <div className="col-span-3 hidden sm:block">Organization</div>
          <div className="col-span-2 hidden md:block">Date</div>
          <div className="col-span-1 hidden lg:block">Status</div>
          <div className="col-span-1 text-right">View</div>
        </div>

        {/* Certificate Row */}
        <div className="grid grid-cols-12 gap-3 px-4 py-4 border-b border-border hover:bg-muted/30 transition-colors items-center">
          {/* Event/Certificate Column */}
          <div className="col-span-5 flex items-start gap-3">
            <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {currentCert.eventName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentCert.verificationId?.slice(0, 20)}...
              </p>
            </div>
          </div>

          {/* Organization Column */}
          <div className="col-span-3 hidden sm:block">
            <p className="text-sm text-foreground truncate">
              {currentCert.organizationName || currentCert.privateOrgName || 'N/A'}
            </p>
          </div>

          {/* Date Column */}
          <div className="col-span-2 hidden md:block">
            <p className="text-sm text-foreground">
              {new Date(currentCert.issuedDate).toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          {/* Status Column */}
          <div className="col-span-1 hidden lg:block">
            <Badge 
              variant="secondary" 
              className="bg-green-100 text-green-700 hover:bg-green-100 text-xs"
            >
              Valid
            </Badge>
          </div>

          {/* Action Column */}
          <div className="col-span-1 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => handleViewCertificate(currentCert)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Info */}
        <div className="sm:hidden px-4 py-3 bg-muted/20 rounded-b-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Organization:</span>
              <p className="font-medium text-foreground mt-0.5 truncate">
                {currentCert.organizationName || currentCert.privateOrgName || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>
              <p className="font-medium text-foreground mt-0.5">
                {new Date(currentCert.issuedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        {certificates.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-4">
            {certificates.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentIndex
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to certificate ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
