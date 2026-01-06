"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, ExternalLink, Search, Award, Filter, ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useSocket } from "@/components/socket-provider"
import { toast } from "sonner"

interface Certificate {
  _id: string
  recipientName: string
  recipientEmail: string
  eventName: string
  issuedDate: string
  certificateUrl: string
  organizationName?: string
  privateOrgName?: string
}

interface MyCertificatesSectionProps {
  userId?: string
}

export function MyCertificatesSection({ userId }: MyCertificatesSectionProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const itemsPerPage = 6
  const { socket } = useSocket()

  useEffect(() => {
    fetchCertificates()
  }, [userId])

  // Listen for real-time certificate updates
  useEffect(() => {
    if (!socket) return

    socket.on('new-certificate', (data) => {
      console.log('📢 New certificate received:', data)
      toast.success('New Certificate Received!', {
        description: `${data.eventName} certificate is now available`,
      })
      fetchCertificates() // Refresh list
    })

    return () => {
      socket.off('new-certificate')
    }
  }, [socket])

  useEffect(() => {
    if (searchQuery) {
      const filtered = certificates.filter(cert => 
        cert.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cert.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cert.privateOrgName?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredCertificates(filtered)
      setCurrentPage(1) // Reset to page 1 when searching
    } else {
      setFilteredCertificates(certificates)
    }
  }, [searchQuery, certificates])

  // Calculate pagination
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCertificates = filteredCertificates.slice(startIndex, endIndex)

  // Reset to page 1 if current page exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/my-certificates')
      const data = await response.json()

      if (data.success) {
        setCertificates(data.certificates || [])
        setFilteredCertificates(data.certificates || [])
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your certificates...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="w-6 h-6 text-[#8FD6BD]" />
              My Certificates
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No certificates found" : "No certificates yet"}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? "Try adjusting your search query" 
                  : "Certificates you receive will appear here"
                }
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCertificates.map((cert) => (
                <Card key={cert._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Certificate Preview */}
                    <div className="aspect-video bg-gradient-to-br from-[#21808D] to-[#8FD6BD] rounded-lg flex items-center justify-center">
                      <Award className="w-12 h-12 text-white" />
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{cert.eventName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {cert.organizationName || cert.privateOrgName || "Organization"}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCertificate(cert)
                          setShowDetailModal(true)
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-[#21808D] hover:bg-[#1a6370]"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = cert.certificateUrl
                          link.download = `${cert.eventName}-certificate.pdf`
                          link.click()
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredCertificates.length)} of {filteredCertificates.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`h-8 w-8 p-0 ${
                              currentPage === page 
                                ? "bg-[#21808D] hover:bg-[#1a6570] text-white" 
                                : ""
                            }`}
                          >
                            {page}
                          </Button>
                        )
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-1 text-gray-400">
                            ...
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Certificate Detail Modal */}
      {showDetailModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <Card className="bg-white p-4 md:p-8 rounded-2xl max-w-4xl w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-2xl md:text-3xl font-bold truncate">{selectedCertificate.eventName}</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  Issued on {new Date(selectedCertificate.issuedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowDetailModal(false)
                setSelectedCertificate(null)
              }}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Certificate Preview */}
            <div className="mb-6">
              <div className="aspect-video bg-gradient-to-br from-[#21808D] to-[#8FD6BD] rounded-lg flex items-center justify-center">
                <Award className="w-24 h-24 text-white" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Certificate Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Event Name</span>
                    <span className="font-semibold text-gray-900">{selectedCertificate.eventName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Organization</span>
                    <span className="font-semibold text-gray-900">
                      {selectedCertificate.organizationName || selectedCertificate.privateOrgName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Recipient Name</span>
                    <span className="font-semibold text-gray-900">{selectedCertificate.recipientName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-600">Recipient Email</span>
                    <span className="font-semibold text-gray-900">{selectedCertificate.recipientEmail}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date Issued</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(selectedCertificate.issuedDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(selectedCertificate.certificateUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Certificate
              </Button>
              <Button
                className="flex-1 bg-[#21808D] hover:bg-[#1a6370]"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = selectedCertificate.certificateUrl
                  link.download = `${selectedCertificate.eventName}-certificate.pdf`
                  link.click()
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
