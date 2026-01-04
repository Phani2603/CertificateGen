"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21808D] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-orange-600" />
          </div>
          <Image src="/13.svg" alt="Logo" width={64} height={64} className="mx-auto mb-4 opacity-50" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Academic System Coming Soon
        </h1>
        
        <p className="text-gray-600 mb-6">
          The academic institution dashboard (universities, colleges, and clubs) is currently under development 
          and will be available soon. We're working hard to bring you the best experience!
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">What's Coming:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• University and college organization management</li>
            <li>• Club creation and membership</li>
            <li>• Academic event certificate generation</li>
            <li>• Student verification and tracking</li>
          </ul>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          In the meantime, you can use our Corporate or Individual dashboards.
        </p>
        
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push("/select-type")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Selection
          </Button>
          <Button
            onClick={() => router.push("/")}
            className="bg-[#21808D] hover:bg-[#1a6570] text-white"
          >
            Go to Home
          </Button>
        </div>
      </Card>
    </div>
  )
}
