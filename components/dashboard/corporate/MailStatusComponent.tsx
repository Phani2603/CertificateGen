"use client"

import React, { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

interface MailStatusResponse {
  total: number
  sent: number
  pending: number
  failed: number
  configError: number
  isComplete: boolean
  eventName?: string
  orgName?: string
}

interface MailStatusComponentProps {
  batchId?: string
  className?: string
}

export function MailStatusComponent({ batchId: propBatchId, className }: MailStatusComponentProps) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState<MailStatusResponse | null>(null)
  const [activeBatchId, setActiveBatchId] = useState<string | undefined>(propBatchId)
  const containerRef = useRef<HTMLDivElement>(null)

  // Listen for global mail send events
  useEffect(() => {
    const handleMailBatchStarted = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.batchId) {
        setActiveBatchId(customEvent.detail.batchId)
        setExpanded(true) // Auto-expand when a new batch starts
      }
    }
    
    window.addEventListener('mail-batch-started', handleMailBatchStarted)
    return () => window.removeEventListener('mail-batch-started', handleMailBatchStarted)
  }, [])

  // Sync prop batchId
  useEffect(() => {
    if (propBatchId) setActiveBatchId(propBatchId)
  }, [propBatchId])

  // Polling logic
  useEffect(() => {
    if (!activeBatchId) return

    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const poll = async () => {
      try {
        const res = await fetch(`/api/email/batch-status/${activeBatchId}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        if (isMounted) {
          setStatus(data)
          if (!data.isComplete) {
            timeoutId = setTimeout(poll, 2500)
          }
        }
      } catch (err) {
        console.error("Error polling mail status", err)
        if (isMounted) {
          timeoutId = setTimeout(poll, 5000)
        }
      }
    }

    poll()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [activeBatchId])

  // Click outside logic
  useEffect(() => {
    let startedOutsideWhileOpen = false

    const isOutside = (event: Event) => {
      const el = containerRef.current
      return !!el && !el.contains((event.target as Node) || null)
    }

    const handlePointerStart = (event: PointerEvent) => {
      startedOutsideWhileOpen = expanded && isOutside(event)
    }

    const handleClick = (event: MouseEvent) => {
      if (startedOutsideWhileOpen && expanded && isOutside(event)) {
        setExpanded(false)
      }
      startedOutsideWhileOpen = false
    }

    document.addEventListener("pointerdown", handlePointerStart)
    document.addEventListener("click", handleClick)

    return () => {
      document.removeEventListener("pointerdown", handlePointerStart)
      document.removeEventListener("click", handleClick)
    }
  }, [expanded])

  const isLive = status ? (!status.isComplete && (status.pending > 0 || status.sent + status.failed < status.total)) : false
  const hasIssues = status ? (status.failed > 0 || status.configError > 0) : false
  
  // LED styles
  let ledClass = "bg-[#3a3a3a]"
  let ledStateClass = ""
  
  if (status) {
    if (isLive) {
      ledClass = "bg-[radial-gradient(circle_at_35%_30%,_#7fe896,_#34c759_65%)] shadow-[0_0_0_1px_rgba(52,199,89,0.3),_0_0_10px_2px_rgba(52,199,89,0.8),_0_0_22px_4px_rgba(52,199,89,0.35)]"
      ledStateClass = "on"
    } else if (hasIssues) {
      ledClass = "bg-[radial-gradient(circle_at_35%_30%,_#ff8178,_#ff3b30_65%)] shadow-[0_0_0_1px_rgba(255,59,48,0.3),_0_0_10px_2px_rgba(255,59,48,0.75)]"
    } else {
      ledClass = "bg-[radial-gradient(circle_at_35%_30%,_#7fe896,_#34c759_65%)] shadow-[0_0_0_1px_rgba(52,199,89,0.3),_0_0_8px_1px_rgba(52,199,89,0.7)]"
    }
  }

  const springConfig = {
    type: "spring" as const,
    stiffness: 550,
    damping: 45,
    mass: 0.7,
  }

  const percent = status && status.total > 0 ? Math.min(100, ((status.sent + status.failed) / status.total) * 100) : 0

  return (
    <div className={cn("relative w-[172px] h-[58px] z-50", className)}>
      <motion.div
        ref={containerRef}
        className={cn(
          "absolute top-0 left-0 bg-[#0a0a0a] text-white rounded-2xl overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_10px_28px_-12px_rgba(0,0,0,0.45)]",
          !expanded ? "cursor-pointer" : ""
        )}
        initial={false}
        animate={{
          width: expanded ? 320 : 172,
          height: expanded ? 250 : 58,
        }}
        transition={springConfig}
        onClick={() => {
          if (!expanded) setExpanded(true)
        }}
      >
        <motion.div
          className={cn(
            "flex flex-col flex-shrink-0 px-4",
            expanded ? "h-[68px] justify-start pt-[18px]" : "h-[58px] justify-center gap-[5px]"
          )}
          layout
        >
          <div className="flex items-center gap-[7px] text-[12.5px] tracking-[0.02em] text-white/50 transition-all duration-[250ms]">
            <div
              className={cn(
                "relative rounded-full flex-shrink-0 transition-all duration-[250ms] shadow-[0_1px_1px_rgba(0,0,0,0.4)_inset]",
                expanded ? "w-[10px] h-[10px]" : "w-2 h-2",
                !status || (!isLive && !hasIssues && !status.isComplete) ? "bg-[#3a3a3a]" : ledClass
              )}
            >
              {ledStateClass === "on" && (
                <div className="absolute -inset-[5px] rounded-full border border-[#34c759]/50 animate-[ring_1.7s_ease-out_infinite]" />
              )}
            </div>
            <span style={{ fontSize: expanded ? "13.5px" : "12.5px" }}>Mail batch</span>
          </div>
          <div 
            className="font-semibold tracking-[-0.01em] text-white transition-all duration-[250ms]"
            style={{ fontSize: expanded ? "18px" : "15px" }}
          >
            {!status ? "No mail jobs" : isLive ? "Sending mails…" : hasIssues ? "Finished · issues" : "All mails sent"}
          </div>
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.16 }}
              className="px-[18px] pb-[18px] pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[14px] tracking-[0.01em] text-white/50 mb-4">
                <span className="font-medium text-white/90">{status?.eventName || "No Event"}</span> <span className="opacity-50">·</span> {status?.orgName || "No Organization"}
              </div>
              
              <div className="h-[6px] bg-white/10 rounded-full overflow-hidden mb-[22px]">
                <motion.div 
                  className={cn(
                    "h-full",
                    hasIssues ? "bg-[#ff3b30] shadow-[0_0_8px_0_rgba(255,59,48,0.6)]" : "bg-[#34c759] shadow-[0_0_8px_0_rgba(52,199,89,0.6)]"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              <div className="grid grid-cols-3 gap-[6px]">
                <div>
                  <div className="text-[36px] font-bold tracking-[-0.03em] text-white leading-none font-variant-numeric tabular-nums">
                    {status?.sent || 0}
                  </div>
                  <div className="text-[13px] tracking-[0.03em] text-white/50 mt-2">SENT</div>
                </div>
                <div>
                  <div className="text-[36px] font-bold tracking-[-0.03em] text-white leading-none font-variant-numeric tabular-nums">
                    {status?.pending || 0}
                  </div>
                  <div className="text-[13px] tracking-[0.03em] text-white/50 mt-2">IN FLIGHT</div>
                </div>
                <div className={cn(hasIssues ? "text-[#ff3b30]" : "")}>
                  <div className="text-[36px] font-bold tracking-[-0.03em] leading-none font-variant-numeric tabular-nums">
                    {(status?.failed || 0) + (status?.configError || 0)}
                  </div>
                  <div className={cn("text-[13px] tracking-[0.03em] mt-2", hasIssues ? "text-[#ff3b30]/80" : "text-white/50")}>FAILED</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ring {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}} />
    </div>
  )
}
