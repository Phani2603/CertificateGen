"use client"

import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IndividualProfileOverlay } from "@/components/dashboard/individual/IndividualProfileOverlay"

interface IndividualHeaderProps {
  userName: string
  userEmail?: string
  userImage?: string
}

export function IndividualHeader({ userName, userEmail, userImage }: IndividualHeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/individual-dashboard" className="flex items-center gap-2">
            <div className="bg-black rounded-md p-1.5 h-9 w-9 flex items-center justify-center">
              <Image src="/cflo1.svg" alt="Logo" width={20} height={20} className="invert" />
            </div>
            <span className="font-bold text-lg tracking-tight text-black">Certiflo</span>
          </Link>

          {/* Right Side - Avatar Only */}
          <div className="flex items-center gap-3">
            <IndividualProfileOverlay
              trigger={
                <button className="relative">
                  <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity border border-neutral-200">
                    <AvatarImage src={userImage} alt={userName} />
                    <AvatarFallback className="bg-black text-white text-sm">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />
          </div>
        </div>
      </div>
    </header>
  )
}
