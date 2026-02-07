"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HiOutlineMail, HiOutlineClock } from "react-icons/hi"
import { BsShieldCheck } from "react-icons/bs"

interface UserProfileCardProps {
  name: string
  email: string
  image?: string
  accountType: string
  joinedDate: string
  profileCompletion: number
  trustScore: string
  lastActive: string
  userId: string
  isOnline?: boolean
}

export function UserProfileCard({
  name,
  email,
  image,
  accountType,
  joinedDate,
  profileCompletion,
  trustScore,
  lastActive,
  userId,
  isOnline = false
}: UserProfileCardProps) {
  const isCorporate = accountType?.toLowerCase() === 'corporate'
  
  const getTrustScoreColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'high':
        return 'bg-primary/20 text-primary'
      case 'medium':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-500'
      case 'low':
        return 'bg-destructive/20 text-destructive'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getTrustScoreBarColor = (score: string) => {
    switch (score.toLowerCase()) {
      case 'high':
        return 'bg-primary'
      case 'medium':
        return 'bg-amber-500'
      case 'low':
        return 'bg-destructive'
      default:
        return 'bg-muted'
    }
  }

  const formattedJoinDate = new Date(joinedDate).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })

  // Format last active to relative time
  const getRelativeTime = (dateString: string) => {
    if (dateString === 'Never' || !dateString) return 'Never'
    
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
      return `${Math.floor(diffDays / 365)}y ago`
    } catch (e) {
      return lastActive
    }
  }

  return (
    <div className="bg-background rounded-lg border border-border p-4 sm:p-5 h-full">
      {/* Header with Avatar and Name */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border-2 border-border">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold font-montserrat">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold text-foreground font-montserrat">{name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs font-montserrat capitalize">
              {accountType} Account
            </Badge>
          </div>
        </div>
        {isOnline && (
          <div className="h-1 w-2 rounded-full bg-primary animate-pulse"></div>
        )}
      </div>

      {/* Contact Information */}
      <div className="mb-6 pb-4 border-b border-border">
        <h4 className="text-sm font-semibold text-foreground font-montserrat mb-2">Contact Information</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-montserrat">
            <HiOutlineMail className="h-4 w-4 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-montserrat">
            <HiOutlineClock className="h-4 w-4 shrink-0" />
            <span>Joined {formattedJoinDate}</span>
          </div>
        </div>
      </div>

      {/* Profile Completion */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-sm font-semibold text-foreground font-montserrat">Profile Completion</h4>
          <span className="text-sm font-bold text-foreground font-montserrat">{profileCompletion}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-foreground rounded-full transition-all duration-500"
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
      </div>

      {/* Trust Score - Only show for non-corporate users */}
      {!isCorporate && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-sm font-semibold text-foreground font-montserrat">Trust Score</h4>
            <Badge variant="secondary" className={`text-xs font-bold font-montserrat ${getTrustScoreColor(trustScore)}`}>
              {trustScore}
            </Badge>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${getTrustScoreBarColor(trustScore)} rounded-full transition-all duration-500`}
              style={{ width: trustScore.toLowerCase() === 'high' ? '100%' : trustScore.toLowerCase() === 'medium' ? '60%' : '30%' }}
            ></div>
          </div>
        </div>
      )}

      {/* Last Active & User ID */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground font-montserrat mb-1">Last Active</h4>
          <p className="text-sm font-bold text-foreground font-montserrat">{getRelativeTime(lastActive)}</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground font-montserrat mb-1">User ID</h4>
          <p className="text-sm font-bold text-foreground font-montserrat truncate" title={userId}>
            {userId.substring(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  )
}
