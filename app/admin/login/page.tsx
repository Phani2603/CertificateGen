"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid admin credentials')
        return
      }

      // Redirect to admin dashboard
      router.push("/admin")
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/landing" className="inline-flex items-center gap-2 mb-8 text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="bg-gray-800 border-gray-700 p-8 md:p-12 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2 text-center text-white">Admin Portal</h2>
          <p className="text-gray-400 mb-8 text-center">
            Restricted access - Administrators only
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-300">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@senement.com"
                className="h-12 mt-2 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                className="h-12 mt-2 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Access Admin Portal'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              This area is restricted to system administrators only.
              <br />
              All access attempts are logged and monitored.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
