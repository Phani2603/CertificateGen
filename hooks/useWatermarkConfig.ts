"use client"

import { useEffect, useState } from "react"
import { loadWatermarkConfig } from "@/lib/watermark-utils"

export function useWatermarkConfig(orgSlug?: string) {
  const [watermarkReady, setWatermarkReady] = useState(false)
  const [watermarkVersion, setWatermarkVersion] = useState(0)

  useEffect(() => {
    let active = true

    setWatermarkReady(false)

    const refreshWatermarkConfig = async (forceRefresh: boolean) => {
      await loadWatermarkConfig(forceRefresh, orgSlug)
      if (active) {
        setWatermarkReady(true)
        setWatermarkVersion(Date.now())
      }
    }

    void refreshWatermarkConfig(false)

    const handleLocalUpdate = () => {
      void refreshWatermarkConfig(true)
    }

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === 'watermark-config-updated-at') {
        void refreshWatermarkConfig(true)
      }
    }

    window.addEventListener('watermark-config-updated', handleLocalUpdate)
    window.addEventListener('storage', handleStorageUpdate)

    return () => {
      active = false
      window.removeEventListener('watermark-config-updated', handleLocalUpdate)
      window.removeEventListener('storage', handleStorageUpdate)
    }
  }, [orgSlug])

  return {
    watermarkReady,
    watermarkVersion,
  }
}
