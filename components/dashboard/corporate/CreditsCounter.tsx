"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const CreditsIcon = () => (
  <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M13 0C15.2091 0 17 1.79086 17 4V14C17 16.2091 15.2091 18 13 18H4C1.79086 18 1.61066e-08 16.2091 0 14V4C0 1.79086 1.79086 8.0532e-09 4 0H13ZM3.94434 1C2.28753 1.00006 0.944336 2.34318 0.944336 4V14C0.944336 15.6568 2.28753 16.9999 3.94434 17H13.0557C14.7124 16.9999 16.0557 15.6568 16.0557 14V4C16.0557 2.34322 14.7124 1.00012 13.0557 1H3.94434Z" fill="currentColor"/>
    <path d="M13 4.49998C1 1.50005 1 16.5 13 13.5" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
)

const AnimatedDigit = ({ digit }: { digit: string }) => {
  if (digit === ',' || digit === '.') {
    return <span className="inline-block text-[14px] font-rx100 leading-none translate-y-[-1px]">{digit}</span>
  }
  
  return (
    <div 
      className="relative overflow-hidden inline-block font-rx100 text-[14px] leading-none" 
      style={{ height: '14px', width: '1ch' }} 
      aria-hidden="true"
    >
      <div 
        className="absolute top-0 left-0 flex flex-col w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateY(-${Number(digit) * 10}%)` }}
      >
        {[0,1,2,3,4,5,6,7,8,9].map(n => (
          <div key={n} className="h-[14px] flex items-center justify-center w-full leading-none">{n}</div>
        ))}
      </div>
    </div>
  )
}

export function CreditsCounter({ organizationSlug }: { organizationSlug: string }) {
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState<number | null>(null)
  const [unlimited, setUnlimited] = useState(false)

  const fetchQuota = async () => {
    try {
      const response = await fetch(`/api/quota/org/${organizationSlug}`)
      const result = await response.json()
      if (result.success) {
        setAvailable(result.data.available)
        setUnlimited(result.data.unlimited)
      }
    } catch (err) {
      console.error('[CreditsCounter] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuota()
    const interval = setInterval(fetchQuota, 30000)
    
    // Listen for updates from other parts of the app
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ amount?: number, refresh?: boolean }>
      if (customEvent.detail?.refresh) {
        fetchQuota()
      } else {
        const amount = customEvent.detail?.amount || 1
        setAvailable(prev => prev !== null ? Math.max(0, prev - amount) : prev)
      }
    }
    
    window.addEventListener('update-credits', handleUpdate)
    return () => {
      clearInterval(interval)
      window.removeEventListener('update-credits', handleUpdate)
    }
  }, [organizationSlug])

  const isZero = available === 0 && !unlimited
  const isLow = !unlimited && available !== null && available <= 10 && available > 0

  return (
    <div className="relative flex items-center justify-center h-10 md:h-12">
      {process.env.NODE_ENV === 'development' && !loading && !isZero && !unlimited && (
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('update-credits', { detail: { amount: 1 } }))}
          className="absolute -bottom-6 right-0 text-[10px] text-gray-400 hover:text-black whitespace-nowrap cursor-pointer z-50"
        >
          Test -1
        </button>
      )}

      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300",
          loading ? "bg-white border border-gray-200" :
          isZero ? "bg-black text-white border border-black" : 
          isLow ? "bg-white text-black border-2 border-black" :
          "bg-white text-black border border-gray-200 shadow-sm"
        )}
        aria-live="polite"
        title="Remaining Credits"
      >
        <div className="flex items-center">
          {loading ? (
            <span className="text-[14px] font-rx100 leading-none text-gray-400 px-1 translate-y-[-1px]">--</span>
          ) : unlimited ? (
            <span className="text-[18px] leading-none px-1 translate-y-[-1px]">∞</span>
          ) : (
            <>
              <span className="sr-only">{available} credits remaining</span>
              <div className="flex items-center" aria-hidden="true">
                {available!.toLocaleString().split('').map((char, i, arr) => (
                  <AnimatedDigit key={arr.length - i} digit={char} />
                ))}
              </div>
            </>
          )}
        </div>
        <CreditsIcon />
      </div>
    </div>
  )
}
