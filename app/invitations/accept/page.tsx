"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, update } = useSession()

  const token = searchParams.get("token") || searchParams.get("invite")

  useEffect(() => {
    async function handleAcceptance() {
      if (!token) {
        // No token provided; go home
        router.replace("/")
        return
      }

      if (status === "authenticated") {
        try {
          const res = await fetch("/api/invitations/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          })
          const data = await res.json()
          if (data.success && data.orgSlug) {
            // Force session update and wait for it
            console.log('[Invite Accept] Updating session...')
            await update()
            
            // Force immediate profile cache refresh
            if (typeof window !== 'undefined') {
              const { mutate } = await import('swr')
              console.log('[Invite Accept] Invalidating profile cache...')
              // Force revalidation and wait for it
              await mutate('/api/profile', undefined, { revalidate: true })
            }
            
            console.log('[Invite Accept] Redirecting to dashboard with fresh flag...')
            // Redirect with flag to indicate fresh acceptance
            router.replace(`/${data.orgSlug}/dashboard?justAccepted=true`)
          } else {
            // Failed to accept; show login so user can retry or fix
            router.replace(`/login`)
          }
        } catch (err) {
          console.error('[Invite Accept] Error:', err)
          router.replace(`/login`)
        }
      } else if (status === "unauthenticated") {
        // Forward to login and preserve invite token
        router.replace(`/login?invite=${encodeURIComponent(token)}`)
      }
      // If status === 'loading', wait
    }

    handleAcceptance()
  }, [status, token, router, update])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21808D] mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing invitation...</p>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#21808D] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
