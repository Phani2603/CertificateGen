"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Grain from "@/components/ui/Grain"

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
      // Get geolocation if available
      let geoLocation: { latitude: number; longitude: number } | null = null
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          geoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        } catch (geoErr) {
          console.warn('[Admin Login] Geolocation denied or unavailable:', geoErr)
        }
      }

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          geoLocation
        }),
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
    <div className="admin-login-hero relative isolate min-h-screen overflow-hidden px-4 pt-10 sm:px-6 sm:pt-12">
      <div className="absolute left-0 top-0 z-20 h-[3px] w-full bg-[linear-gradient(90deg,#ff6b6b_0%,#ffd166_20%,#7ad46a_40%,#4dabf7_60%,#b197fc_80%,#ff9f1c_100%)]" />

      <div className="pointer-events-none absolute inset-0 z-10 bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27g%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.65%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix type=%27saturate%27 values=%270%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23g)%27/%3E%3C/svg%3E')] opacity-[0.04] mix-blend-overlay" />

      <div className="relative z-10 flex min-h-[calc(100vh-3px)] w-full items-center justify-center py-6">
        <div className="login-wrapper relative w-full max-w-[1120px] overflow-hidden rounded-lg border border-white/70 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-[2px] sm:p-9 lg:p-12">
          <Grain className="rounded-lg z-10" opacity={0.1} baseFrequency={0.58} numOctaves={4} tileSize={170} blendMode="overlay" />

          <div className="relative z-20 mx-auto w-full max-w-[320px] rounded-2xl border border-neutral-900/20 bg-white/94 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.14)] sm:p-6">
            <Link href="/landing" className="mb-4 inline-flex items-center gap-2 text-xs text-neutral-700 transition hover:text-neutral-950">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>

            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path fill="#111" d="M12 3C9.66 3 7.714 4.502 6.725 6.572c-1.475.346-2.775.843-3.756 1.473C1.908 8.725 1 9.712 1 11c0 .916.468 1.687 1.099 2.284.628.594 1.484 1.083 2.459 1.473C6.512 15.539 9.144 16 12 16s5.488-.461 7.442-1.243c.975-.39 1.83-.88 2.46-1.473C22.531 12.687 23 11.915 23 11c0-1.288-.908-2.275-1.969-2.955-.982-.63-2.28-1.127-3.756-1.473C16.286 4.502 14.341 3 12 3ZM8.372 7.8C9.039 6.072 10.468 5 12 5s2.96 1.072 3.628 2.8c.232.6.356 1.246.37 1.897C14.79 9.89 13.436 10 12 10s-2.79-.11-3.999-.303A5.638 5.638 0 0 1 8.372 7.8Zm-3.478 9.647a1 1 0 1 0-1.788-.894l-1 2a1 1 0 1 0 1.788.894l1-2Zm16-.894a1 1 0 1 0-1.788.894l1 2a1 1 0 1 0 1.788-.894l-1-2ZM13 18a1 1 0 1 0-2 0v3a1 1 0 1 0 2 0v-3Z"/>
</svg>

              </div>
            </div>

            <h2 className="mb-1 text-center text-xl font-semibold tracking-tight text-neutral-900">Admin Portal</h2>
            <p className="mb-5 text-center text-xs text-neutral-700">
              Authorized administrators only
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <Label htmlFor="email" className="text-xs text-neutral-800">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@senement.com"
                  className="mt-1.5 h-10 rounded-lg border-neutral-400/70 bg-white text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:ring-neutral-500"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs text-neutral-800">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  className="mt-1.5 h-10 rounded-lg border-neutral-400/70 bg-white text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:ring-neutral-500"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-neutral-500 bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-10 w-full rounded-lg bg-neutral-900 text-sm text-white hover:bg-neutral-800"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Access Admin Portal'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-[11px] leading-relaxed text-neutral-600">
                Access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-login-hero {
          background-color: #e8edd8;
          background-image:
            radial-gradient(ellipse at 10% 0%, rgba(200, 217, 122, 0.5) 0%, rgba(200, 217, 122, 0) 40%),
            radial-gradient(ellipse at 90% 0%, rgba(184, 168, 217, 0.4) 0%, rgba(184, 168, 217, 0) 35%),
            radial-gradient(ellipse at 5% 100%, rgba(168, 200, 122, 0.45) 0%, rgba(168, 200, 122, 0) 40%),
            radial-gradient(ellipse at 50% 60%, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 30%);
          background-repeat: no-repeat;
        }

        .login-wrapper {
          background-color: #5a7c7d;
          background-image:
            radial-gradient(ellipse at 0% 50%, rgba(80, 110, 112, 0.8) 0%, rgba(80, 110, 112, 0) 55%),
            radial-gradient(ellipse at 80% 15%, rgba(184, 121, 58, 0.9) 0%, rgba(184, 121, 58, 0) 50%),
            radial-gradient(ellipse at 90% 60%, rgba(168, 144, 96, 0.74) 0%, rgba(168, 144, 96, 0) 45%),
            radial-gradient(ellipse at 40% 100%, rgba(61, 92, 94, 0.92) 0%, rgba(61, 92, 94, 0) 50%);
          background-repeat: no-repeat;
        }
      `}</style>
    </div>
  )
}
