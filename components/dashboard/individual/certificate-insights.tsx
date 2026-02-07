"use client"

import { Card } from "@/components/ui/card"
import { BsFileEarmarkText, BsCash, BsGraphUp, BsShieldX } from "react-icons/bs"
import "@/styles/nature.css"

interface CertificateInsightsProps {
  totalIssued?: number
  eventsCovered?: number
  activeOrgs?: number
  suspensions?: number
  trend?: number
}

export function CertificateInsights({ 
  totalIssued = 0,
  eventsCovered = 0,
  activeOrgs = 0,
  suspensions = 0,
  trend = 0
}: CertificateInsightsProps) {
  return (
    <Card className="p-3 border border-border shadow-sm bg-card font-montserrat">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Certificate insights</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Weekly overview</p>
        </div>
        <button className="h-6 w-6 rounded-lg hover:bg-accent/10 flex items-center justify-center transition-colors">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Main Content: Left and Right Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Side - Total Summary */}
        <div className="flex flex-col justify-center">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">{totalIssued}</span>
              {trend !== 0 && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  trend > 0 ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                }`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total certificates issued
            </p>
            <p className="text-[10px] text-muted-foreground">
              vs last week
            </p>
          </div>
        </div>

        {/* Right Side - 2x2 Grid of Stats */}
        <div className="grid grid-cols-2 gap-2">
          {/* Issued */}
          <div className="space-y-1 p-2 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center">
                <BsFileEarmarkText className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Issued</span>
            </div>
            <div className="text-lg font-bold text-foreground">{totalIssued}</div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
            </div>
          </div>

          {/* Events */}
          <div className="space-y-1 p-2 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center">
                <BsCash className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Events</span>
            </div>
            <div className="text-lg font-bold text-foreground">{eventsCovered}</div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '48%' }} />
            </div>
          </div>

          {/* Suspensions */}
          <div className="space-y-1 p-2 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded bg-destructive/20 flex items-center justify-center">
                <BsShieldX className="h-2.5 w-2.5 text-destructive" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Suspensions</span>
            </div>
            <div className="text-lg font-bold text-foreground">{suspensions}</div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-destructive rounded-full" style={{ width: suspensions > 0 ? '100%' : '0%' }} />
            </div>
          </div>

          {/* Organizations */}
          <div className="space-y-1 p-2 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center">
                <BsGraphUp className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Orgs</span>
            </div>
            <div className="text-lg font-bold text-foreground">{activeOrgs}</div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '31%' }} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
