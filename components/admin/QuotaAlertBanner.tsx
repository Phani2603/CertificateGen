"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, Bell, BellOff } from "lucide-react"
import Link from "next/link"

interface QuotaAlert {
  orgId: string
  orgName: string
  orgSlug: string
  severity: 'critical' | 'warning'
  percentage: string
  used: number
  quota: number
  available: number
  message: string
}

export function QuotaAlertBanner() {
  const [alerts, setAlerts] = useState<QuotaAlert[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(false)

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/quota/check-alerts')
      const result = await response.json()

      if (result.success && result.alerts) {
        setAlerts(result.alerts)
        
        // Play sound for new critical alerts if enabled
        if (soundEnabled && result.critical > 0) {
          const hasNewCritical = result.alerts.some(
            (alert: QuotaAlert) => alert.severity === 'critical' && !dismissed.has(alert.orgId)
          )
          if (hasNewCritical) {
            // Simple beep sound (you can replace with an actual sound file)
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            oscillator.connect(audioContext.destination)
            oscillator.frequency.value = 800
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.2)
          }
        }
      }
    } catch (error) {
      console.error('[QuotaAlertBanner] Error fetching alerts:', error)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // Check for alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [soundEnabled, dismissed])

  const handleDismiss = (orgId: string) => {
    setDismissed(prev => new Set([...prev, orgId]))
  }

  const visibleAlerts = alerts.filter(alert => !dismissed.has(alert.orgId))
  const criticalAlerts = visibleAlerts.filter(a => a.severity === 'critical')
  const warningAlerts = visibleAlerts.filter(a => a.severity === 'warning')

  if (visibleAlerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            {criticalAlerts.length > 0 && (
              <span className="text-red-600">{criticalAlerts.length} Critical</span>
            )}
            {criticalAlerts.length > 0 && warningAlerts.length > 0 && <span className="text-gray-400"> • </span>}
            {warningAlerts.length > 0 && (
              <span className="text-orange-600">{warningAlerts.length} Warning</span>
            )}
            {' '}Quota Alert{visibleAlerts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-7 text-xs"
        >
          {soundEnabled ? (
            <><Bell className="w-3 h-3 mr-1" /> Sound On</>
          ) : (
            <><BellOff className="w-3 h-3 mr-1" /> Sound Off</>
          )}
        </Button>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.map(alert => (
        <Alert key={alert.orgId} className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <AlertTitle className="text-red-900 font-semibold">
              Critical: {alert.orgName}
            </AlertTitle>
            <AlertDescription className="text-red-800 text-sm mt-1">
              {alert.message}
              <div className="mt-2">
                <Link href={`/admin`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100">
                    Manage Quota
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(alert.orgId)}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </Alert>
      ))}

      {/* Warning Alerts */}
      {warningAlerts.map(alert => (
        <Alert key={alert.orgId} className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <div className="flex-1">
            <AlertTitle className="text-orange-900 font-semibold">
              Warning: {alert.orgName}
            </AlertTitle>
            <AlertDescription className="text-orange-800 text-sm mt-1">
              {alert.message}
            </AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(alert.orgId)}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </Alert>
      ))}
    </div>
  )
}
