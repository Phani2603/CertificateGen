"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { History, Download, ChevronLeft, ChevronRight, X, Users, Search } from "lucide-react"
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
  registrationBatchIds?: string[]
}

interface ParticipantItem {
  id: string
  recipientName: string
  recipientEmail: string
  verificationId: string
  issuedAt: string
}

interface ParticipantsPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
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
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [participants, setParticipants] = useState<ParticipantItem[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participantsSearch, setParticipantsSearch] = useState("")
  const [participantsDebouncedSearch, setParticipantsDebouncedSearch] = useState("")
  const [participantsPage, setParticipantsPage] = useState(1)
  const [participantsPagination, setParticipantsPagination] = useState<ParticipantsPagination>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  })
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
      setShowParticipantsModal(false)
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDetailModal])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setParticipantsDebouncedSearch(participantsSearch.trim())
      setParticipantsPage(1)
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [participantsSearch])

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

  const fetchParticipants = async (
    historyId: string,
    page = 1,
    query = '',
    signal?: AbortSignal
  ) => {
    setParticipantsLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })

      if (query) {
        params.set('q', query)
      }

      const response = await fetch(`/api/history/${historyId}/participants?${params.toString()}`, { signal })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load participants')
      }

      setParticipants(data.participants || [])
      setParticipantsPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 20,
          hasNextPage: false,
          hasPrevPage: false,
        }
      )
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Error fetching participants:', error)
        toast.error(error?.message || 'Failed to load participants')
      }
    } finally {
      setParticipantsLoading(false)
    }
  }

  useEffect(() => {
    if (!showParticipantsModal || !selectedHistoryItem?.id) {
      return
    }

    const controller = new AbortController()
    fetchParticipants(selectedHistoryItem.id, participantsPage, participantsDebouncedSearch, controller.signal)

    return () => controller.abort()
  }, [showParticipantsModal, selectedHistoryItem?.id, participantsPage, participantsDebouncedSearch])

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
                      <div className={`w-12 h-12 md:w-14 md:h-14 bg-linear-to-br ${colors[(startIndex + i) % 3]} rounded-lg flex items-center justify-center shrink-0`}>
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
                                  ? "bg-[#21808D] hover:bg-[#1a6370] text-white" 
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
              setShowParticipantsModal(false)
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
                setShowParticipantsModal(false)
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
                <Card className="p-2 md:p-3 lg:p-4 bg-linear-to-br from-[#FF5733] to-[#ff7a59] text-white">
                  <div className="text-lg md:text-2xl lg:text-3xl font-bold">{selectedHistoryItem.certificateCount}</div>
                  <div className="text-[9px] md:text-[10px] lg:text-sm opacity-90">Generated</div>
                </Card>
                <Card className="p-2 md:p-3 lg:p-4 bg-linear-to-br from-[#8FD6BD] to-[#a8e0cd] text-gray-900">
                  <div className="text-lg md:text-2xl lg:text-3xl font-bold">{selectedHistoryItem.successRate}%</div>
                  <div className="text-[9px] md:text-[10px] lg:text-sm opacity-80">Success Rate</div>
                </Card>
                <Card className="p-2 md:p-3 lg:p-4 bg-linear-to-br from-[#F4E04D] to-[#f7e878] text-gray-900">
                  <div className="text-lg md:text-2xl lg:text-3xl font-bold">{selectedHistoryItem.totalSize}</div>
                  <div className="text-[9px] md:text-[10px] lg:text-sm opacity-80">Total Size</div>
                </Card>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  className="border-[#21808D] text-[#21808D] hover:bg-[#21808D] hover:text-white"
                  onClick={() => {
                    setParticipants([])
                    setParticipantsSearch('')
                    setParticipantsDebouncedSearch('')
                    setParticipantsPage(1)
                    setShowParticipantsModal(true)
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Participants
                </Button>
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

      {showParticipantsModal && selectedHistoryItem && (
        <div
          className="fixed inset-0 bg-black/55 flex items-center justify-center z-60 p-2 md:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowParticipantsModal(false)
            }
          }}
        >
          <Card className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl w-full max-w-[96vw] md:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="text-base md:text-xl font-bold truncate">Participants - {selectedHistoryItem.eventName}</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  {participantsPagination.totalItems} recipient{participantsPagination.totalItems === 1 ? '' : 's'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowParticipantsModal(false)}>
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            <div className="relative mb-4">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={participantsSearch}
                onChange={(e) => setParticipantsSearch(e.target.value)}
                placeholder="Search participants by name or email"
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
              {participantsLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-4 border-[#21808D] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-600">No participants found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {participantsDebouncedSearch ? 'Try a different search term.' : 'No recipients are linked to this history entry yet.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Verification ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => (
                      <tr key={participant.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-gray-900">{participant.recipientName}</td>
                        <td className="px-4 py-3 text-gray-700">{participant.recipientEmail}</td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs md:text-sm">{participant.verificationId}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {participant.issuedAt ? new Date(participant.issuedAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {participantsPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 gap-3">
                <p className="text-xs md:text-sm text-gray-600">
                  Page {participantsPagination.currentPage} of {participantsPagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!participantsPagination.hasPrevPage || participantsLoading}
                    onClick={() => setParticipantsPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!participantsPagination.hasNextPage || participantsLoading}
                    onClick={() => setParticipantsPage((prev) => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

