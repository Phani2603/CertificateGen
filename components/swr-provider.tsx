"use client"

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    throw error
  }
  
  return res.json()
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        dedupingInterval: 60000, // 60 seconds (1 minute)
        errorRetryCount: 2,
        errorRetryInterval: 5000,
        shouldRetryOnError: true,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}
