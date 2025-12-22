"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, X, Download } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface HistoryItem {
  id: string
  eventName: string
  clubName: string
  count: number
  date: string
  timestamp: number
  successRate: number
  totalSize: string
}

interface HistorySectionProps {
  generationHistory: HistoryItem[]
  showHistoryDetailModal: boolean
  setShowHistoryDetailModal: (show: boolean) => void
  selectedHistoryItem: HistoryItem | null
  setSelectedHistoryItem: (item: HistoryItem | null) => void
}

export function HistorySection({
  generationHistory,
  showHistoryDetailModal,
  setShowHistoryDetailModal,
  selectedHistoryItem,
  setSelectedHistoryItem,
}: HistorySectionProps) {
  const colors = [
    "from-[#FF5733] to-[#ff7a59]",
    "from-[#8FD6BD] to-[#a8e0cd]",
    "from-[#F4E04D] to-[#f7e878]"
  ]

  const exportToCSV = () => {
    if (generationHistory.length === 0) {
      toast.error('No history data to export')
      return
    }

    // Create CSV content
    const headers = ['Event Name', 'Club Name', 'Certificates Count', 'Date', 'Success Rate', 'Total Size']
    const csvContent = [
      headers.join(','),
      ...generationHistory.map(item => [
        `"${item.eventName}"`,
        `"${item.clubName}"`,
        item.count,
        `"${item.date}"`,
        `${item.successRate}%`,
        `"${item.totalSize}"`
      ].join(','))
    ].join('\n')

    // Create and download file
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

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Generation History</h2>
            {generationHistory.length > 0 && (
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
          {generationHistory.length === 0 ? (
            <div className="text-center py-12">
              <Image src="/13.svg" alt="History" width={64} height={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-gray-500 mb-2">No generation history yet</p>
              <p className="text-sm text-gray-400">Generate certificates for events to see them here</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {generationHistory.map((item, i) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border-2 border-gray-100 rounded-lg hover:shadow-md transition-all bg-white gap-3"
                >
                  <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                    <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${colors[i % 3]} rounded-lg flex items-center justify-center shrink-0`}>
                      <Image src="/13.svg" alt="Event" width={32} height={32}  />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base md:text-lg text-gray-900 truncate">{item.eventName}</h3>
                      <p className="text-sm md:text-base text-gray-500 truncate">{item.count} certificates • {item.date}</p>
                      <p className="text-xs text-gray-400">{item.clubName}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#21808D] hover:bg-[#21808D]/10 w-full sm:w-auto text-sm md:text-base"
                    onClick={() => {
                      setSelectedHistoryItem(item)
                      setShowHistoryDetailModal(true)
                    }}
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* History Detail Modal */}
      {showHistoryDetailModal && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <Card className="bg-white p-4 md:p-8 rounded-2xl max-w-4xl w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-2xl md:text-3xl font-bold truncate">{selectedHistoryItem.eventName}</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Generated on {selectedHistoryItem.date}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowHistoryDetailModal(false)
                setSelectedHistoryItem(null)
              }}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <Card className="p-3 md:p-4 bg-gradient-to-br from-[#FF5733] to-[#ff7a59] text-white">
                <div className="text-2xl md:text-3xl font-bold">{selectedHistoryItem.count}</div>
                <div className="text-[10px] md:text-sm opacity-90">Generated</div>
              </Card>
              <Card className="p-3 md:p-4 bg-gradient-to-br from-[#8FD6BD] to-[#a8e0cd] text-gray-900">
                <div className="text-2xl md:text-3xl font-bold">{selectedHistoryItem.successRate}%</div>
                <div className="text-[10px] md:text-sm opacity-80">Success Rate</div>
              </Card>
              <Card className="p-3 md:p-4 bg-gradient-to-br from-[#F4E04D] to-[#f7e878] text-gray-900">
                <div className="text-2xl md:text-3xl font-bold">{selectedHistoryItem.totalSize}</div>
                <div className="text-[10px] md:text-sm opacity-80">Total Size</div>
              </Card>
            </div>

            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold mb-4 text-gray-900">Generation Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Event Name</span>
                  <span className="font-semibold text-gray-900">{selectedHistoryItem.eventName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Club Name</span>
                  <span className="font-semibold text-gray-900">{selectedHistoryItem.clubName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Date Generated</span>
                  <span className="font-semibold text-gray-900">{selectedHistoryItem.date}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Total Certificates</span>
                  <span className="font-semibold text-gray-900">{selectedHistoryItem.count}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-green-600">{selectedHistoryItem.successRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Size</span>
                  <span className="font-semibold text-gray-900">{selectedHistoryItem.totalSize}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-500 italic">
                Note: Certificate files are downloaded as ZIP and not stored on server.
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
