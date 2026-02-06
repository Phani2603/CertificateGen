"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { SuspensionModal } from "./SuspensionModal"

export function SuspensionChecker() {
    const { data: session, status } = useSession()
    const [isSuspended, setIsSuspended] = useState(false)
    const [suspensionData, setSuspensionData] = useState<{
        reason?: string
        suspendedUntil?: string
    }>({})
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        const checkSuspensionStatus = async () => {
            if (status === 'loading') return
            if (!session?.user?.email) {
                setIsChecking(false)
                return
            }

            try {
                const response = await fetch('/api/user/suspension-status')
                const data = await response.json()

                console.log('[SuspensionChecker] Status response:', data)

                if (data.success) {
                    const suspended = data.isSuspended || false
                    console.log('[SuspensionChecker] Is suspended:', suspended)
                    setIsSuspended(suspended)
                    setSuspensionData({
                        reason: data.reason,
                        suspendedUntil: data.suspendedUntil,
                    })
                }
            } catch (error) {
                console.error('Error checking suspension status:', error)
                // Ensure we don't show suspension on error
                setIsSuspended(false)
            } finally {
                setIsChecking(false)
            }
        }

        checkSuspensionStatus()
    }, [session, status])

    if (isChecking || !session) {
        return null
    }

    // If suspended, show modal and block everything with an overlay
    // Only show if explicitly suspended (not undefined or false)
    if (isSuspended === true) {
        return (
            <>
                {/* Full-screen overlay to block dashboard - z-index 9998 */}
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

                {/* Suspension Modal - Dialog has z-[10001] so it's above the blur */}
                <SuspensionModal
                    isOpen={true}
                    reason={suspensionData.reason}
                    suspendedUntil={suspensionData.suspendedUntil}
                />
            </>
        )
    }

    return null
}
