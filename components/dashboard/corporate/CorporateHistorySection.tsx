"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Download, ChevronLeft, ChevronRight, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface HistoryItem {
  id: string
  eventName: string
  clubName: string
  certificateCount: number
  date: string
  timestamp: number
  successRate: number
  totalSize: string
}

interface CorporateHistorySectionProps {
  organizationId: string
  organizationName: string
}

export function CorporateHistorySection({ organizationId, organizationName }: CorporateHistorySectionProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)
  const itemsPerPage = 5

  useEffect(() => {
    fetchHistory()
  }, [organizationId])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDetailModal])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/history?privateOrgId=${organizationId}&limit=1000`)
      const data = await response.json()

      if (data.success) {
        const formattedHistory = (data.history || []).map((item: any) => ({
          ...item,
          clubName: organizationName // Use org name as club name
        }))
        setHistory(formattedHistory)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (history.length === 0) {
      toast.error('No history data to export')
      return
    }

    const headers = ['Event Name', 'Organization', 'Certificates Count', 'Date', 'Success Rate', 'Total Size']
    const csvContent = [
      headers.join(','),
      ...history.map(item => [
        `"${item.eventName}"`,
        `"${item.clubName}"`,
        item.certificateCount,
        `"${item.date}"`,
        `${item.successRate}%`,
        `"${item.totalSize}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `generation-history-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('History exported successfully!')
  }

  // Calculate pagination
  const totalPages = Math.ceil(history.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = history.slice(startIndex, endIndex)

  // Reset to page 1 if current page exceeds total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  const colors = [
    "from-[#FF5733] to-[#ff7a59]",
    "from-[#8FD6BD] to-[#a8e0cd]",
    "from-[#F4E04D] to-[#f7e878]"
  ]

  return (
    <>
      <style>{`.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}.no-scrollbar::-webkit-scrollbar{display:none;}`}</style>
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Generation History</h2>
            {history.length > 0 && (
              <Button 
                variant="outline" 
                className="border-[#21808D] text-[#21808D] hover:bg-[#21808D] hover:text-white text-sm md:text-base w-full sm:w-auto"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {/* History Items */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Image src="/13.svg" alt="History" width={64} height={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-gray-500 mb-2">No generation history yet</p>
              <p className="text-sm text-gray-400">Generate certificates for events to see them here</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:space-y-4">
                {currentItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border-2 border-gray-100 rounded-lg hover:shadow-md transition-all bg-white gap-3"
                  >
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                      <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${colors[(startIndex + i) % 3]} rounded-lg flex items-center justify-center shrink-0`}>
                        <Image src="/13.svg" alt="Event" width={32} height={32} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base truncate">{item.eventName}</h3>
                        <p className="text-xs md:text-sm text-gray-500">{item.clubName}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.certificateCount} certificates • {item.date}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[#21808D] hover:bg-[#21808D]/10 w-full sm:w-auto text-sm md:text-base"
                      onClick={() => {
                        setSelectedHistoryItem(item)
                        setShowDetailModal(true)
                      }}
                    >
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, history.length)} of {history.length}
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
        </Card>
      </div>

      {/* History Detail Modal */}
      {showDetailModal && selectedHistoryItem && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowDetailModal(false)
              setSelectedHistoryItem(null)
            }
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <Card 
            className="bg-white p-3 md:p-6 lg:p-8 rounded-xl md:rounded-2xl max-w-[95vw] md:max-w-2xl lg:max-w-3xl w-full max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{selectedHistoryItem.eventName}</h2>
                <p className="text-[10px] md:text-xs lg:text-sm text-gray-500 mt-0.5 md:mt-1">Generated on {selectedHistoryItem.date}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0" onClick={() => {
                setShowDetailModal(false)
                setSelectedHistoryItem(null)
              }}>
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            <div 
              className="flex-1 overflow-y-auto pr-0.5 md:pr-1 space-y-4 md:space-y-6 no-scrollbar"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-3 gap-1.5 md:gap-3 lg:gap-4">
                <Card className="p-2 md:p-3 lg:p-4 bg-gradient-to-br from-[#FF5733] to-[#ff7a59] text-white">
                  <div className="text-lg md:text-2xl lg:text-3xl font-bold">{selectedHistoryItem.certificateCount}</div>
                  <div className="text-[9px] md:text-[10px] lg:text-sm opacity-90">Generated</div>
                </Card>
                <Card className="p-2 md:p-3 lg:p-4 bg-gradient-to-br from-[#8FD6BD] to-[#a8e0cd] text-gray-900">
                  <div className="text-lg md:text-2xl lg:text-3xl font-bold">{selectedHistoryItem.successRate}%</div>
                  <div className="text-[9px] md:text-[10px] lg:text-sm opacity-80">Success Rate</div>
                </Card>
                <Card className="p-2 md:p-3 lg:p-4 bg-gradient-to-br from-[#F4E04D] to-[#f7e878] text-gray-900">
                  <div className="text-lg md:text-2xl lg:text-3xl font-bold">{selectedHistoryItem.totalSize}</div>
                  <div className="text-[9px] md:text-[10px] lg:text-sm opacity-80">Total Size</div>
                </Card>
              </div>

              <div className="p-3 md:p-4 lg:p-6 bg-gray-50 rounded-lg">
                <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-gray-900">Generation Summary</h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 gap-2">
                    <span className="text-xs md:text-sm text-gray-600">Event Name</span>
                    <span className="font-semibold text-xs md:text-sm text-gray-900 text-right truncate max-w-[60%]">{selectedHistoryItem.eventName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 gap-2">
                    <span className="text-xs md:text-sm text-gray-600">Organization</span>
                    <span className="font-semibold text-xs md:text-sm text-gray-900 text-right truncate max-w-[60%]">{selectedHistoryItem.clubName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 gap-2">
                    <span className="text-xs md:text-sm text-gray-600">Date Generated</span>
                    <span className="font-semibold text-xs md:text-sm text-gray-900 text-right">{selectedHistoryItem.date}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 gap-2">
                    <span className="text-xs md:text-sm text-gray-600">Total Certificates</span>
                    <span className="font-semibold text-xs md:text-sm text-gray-900">{selectedHistoryItem.certificateCount}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200 gap-2">
                    <span className="text-xs md:text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold text-xs md:text-sm text-green-600">{selectedHistoryItem.successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs md:text-sm text-gray-600">Total Size</span>
                    <span className="font-semibold text-xs md:text-sm text-gray-900">{selectedHistoryItem.totalSize}</span>
                  </div>
                </div>
                <p className="mt-3 md:mt-4 text-[10px] md:text-xs text-gray-500 italic">
                  Note: Certificate files are downloaded as ZIP and not stored on server.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
