"use client"

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react"
import { CheckCircle2, Info, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DynamicIslandProvider,
  DynamicIsland,
  DynamicContainer,
  DynamicTitle,
  DynamicDescription,
  SIZE_PRESETS,
  useDynamicIslandSize,
} from "@/components/ui/dynamic-island"

type IslandTone = "success" | "info" | "error"

interface IslandAlert {
  title: string
  description?: string
  tone?: IslandTone
}

interface IslandAlertsContextValue {
  show: (alert: IslandAlert) => void
}

const IslandAlertsContext = createContext<IslandAlertsContextValue | null>(null)

export function IslandAlertsProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<IslandAlert | null>(null)
  const [version, setVersion] = useState(0)

  const show = useCallback((next: IslandAlert) => {
    setAlert(next)
    setVersion((v) => v + 1)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <DynamicIslandProvider initialSize={SIZE_PRESETS.COMPACT}>
      <IslandAlertsContext.Provider value={value}>
        {children}
        <IslandAlertRenderer alert={alert} version={version} />
      </IslandAlertsContext.Provider>
    </DynamicIslandProvider>
  )
}

export function useIslandAlerts() {
  const ctx = useContext(IslandAlertsContext)
  if (!ctx) throw new Error("useIslandAlerts must be used inside IslandAlertsProvider")
  return ctx
}

function IslandAlertRenderer({ alert, version }: { alert: IslandAlert | null; version: number }) {
  const { scheduleAnimation, setSize } = useDynamicIslandSize()

  useEffect(() => {
    if (!alert) return
    setSize(SIZE_PRESETS.COMPACT)
    scheduleAnimation([
      { size: SIZE_PRESETS.LONG, delay: 0 },
      { size: SIZE_PRESETS.MEDIUM, delay: 800 },
      { size: SIZE_PRESETS.COMPACT_MEDIUM, delay: 1700 },
      { size: SIZE_PRESETS.COMPACT, delay: 2400 },
    ])
  }, [alert, scheduleAnimation, setSize, version])

  if (!alert) return null

  const tone = alert.tone || "info"
  const toneStyles: Record<IslandTone, string> = {
    success: "bg-emerald-500/90 text-emerald-50",
    info: "bg-cyan-500/90 text-cyan-50",
    error: "bg-rose-500/90 text-rose-50",
  }

  const Icon = {
    success: CheckCircle2,
    info: Info,
    error: AlertCircle,
  }[tone]

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
      <DynamicIsland id="island-alert">
        <DynamicContainer className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border border-white/10", toneStyles[tone])}>
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <DynamicTitle className="text-base font-semibold text-white leading-tight truncate">
              {alert.title}
            </DynamicTitle>
            {alert.description && (
              <DynamicDescription className="text-xs text-white/80 leading-tight truncate">
                {alert.description}
              </DynamicDescription>
            )}
          </div>
        </DynamicContainer>
      </DynamicIsland>
    </div>
  )
}
