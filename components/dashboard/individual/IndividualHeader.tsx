"use client"

import { Award, LogOut, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/individual-dashboard" className="flex items-center gap-2">
            <Image src="/c.svg" alt="Logo" width={40} height={40} />
            <span className="font-bold text-xl">GetCertificates</span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-[#8FD6BD]" />
              <span className="text-gray-600">Welcome back,</span>
              <span className="font-semibold">{userName}</span>
            </div>

            <IndividualProfileOverlay
              trigger={
                <button className="relative">
                  <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={userImage} alt={userName} />
                    <AvatarFallback className="bg-[#8FD6BD] text-white">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
