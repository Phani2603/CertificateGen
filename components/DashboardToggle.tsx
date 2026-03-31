"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  userData?: any
  privateOrgSlug?: string | null
}

export default function DashboardToggle({ userData, privateOrgSlug }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState<'individual' | 'corporate'>('individual')

  useEffect(() => {
    // Detect which dashboard we're on based on pathname
    if (pathname?.includes('/dashboard') && !pathname?.includes('/individual-dashboard')) {
      setActive('corporate')
    } else {
      setActive('individual')
    }
  }, [pathname])

  const handleSwitch = async (view: 'individual' | 'corporate') => {
    if (view === active) return // Don't navigate if already on that view
    
    setActive(view)

    if (view === 'individual') {
      router.push('/individual-dashboard')
    } else {
      const slug = privateOrgSlug || userData?.privateOrg?.slug || userData?.organizationSlug
      if (slug) {
        router.push(`/${slug}/dashboard`)
      } else {
        try {
          const res = await fetch('/api/private-orgs')
          const data = await res.json()

          if (data?.success && Array.isArray(data.organizations) && data.organizations.length > 0) {
            const firstOrgWithSlug = data.organizations.find((org: any) => org?.slug)
            if (firstOrgWithSlug?.slug) {
              router.push(`/${firstOrgWithSlug.slug}/dashboard`)
              return
            }
          }
        } catch (error) {
          console.error('[DashboardToggle] Failed to resolve organization slug:', error)
        }

        router.push('/create-organization')
      }
    }
  }

  // Determine if we're on corporate dashboard (white bg) or individual (primary bg)
  const isCorporatePage = pathname?.includes('/dashboard') && !pathname?.includes('/individual-dashboard')

  return (
    <div className="relative inline-flex items-center bg-primary-foreground/20 rounded-full p-0.5 sm:p-1 font-montserrat">
      {/* Animated background slider */}
      <div
        className="absolute top-0.5 sm:top-1 left-0.5 sm:left-1 h-[calc(100%-4px)] sm:h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-out"
        style={{
          width: 'calc(50% - 2px)',
          transform: active === 'corporate' ? 'translateX(calc(100% + 2px))' : 'translateX(0)',
          background: active === 'corporate' 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
            : 'rgba(255, 255, 255, 0.95)',
          boxShadow: active === 'corporate'
            ? '0 2px 8px rgba(16, 185, 129, 0.3)'
            : '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      />
      
      <button
        onClick={() => handleSwitch('individual')}
        className={`relative z-10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 ${
          active === 'individual' 
            ? 'text-primary' 
            : isCorporatePage
              ? 'text-gray-600 hover:text-gray-900'
              : 'text-primary-foreground/70 hover:text-primary-foreground'
        }`}
        aria-pressed={active === 'individual'}
      >
        Individual
      </button>

      <button
        onClick={() => handleSwitch('corporate')}
        className={`relative z-10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 ${
          active === 'corporate'
            ? 'text-white'
            : isCorporatePage
              ? 'text-gray-600 hover:text-gray-900'
              : 'text-primary-foreground/70 hover:text-primary-foreground'
        }`}
        aria-pressed={active === 'corporate'}
      >
        Corporate
      </button>
    </div>
  )
}
