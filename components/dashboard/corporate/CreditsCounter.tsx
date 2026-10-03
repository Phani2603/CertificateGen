"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

import Image from "next/image"

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
        <Image src="/credits-new.svg" alt="Credits" width={24} height={24} className="shrink-0" />
      </div>
    </div>
  )
}
