"use client"

import { signOut } from "next-auth/react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Menu, X } from "lucide-react"

export type CorporatePage = "overview" | "events" | "history" | "members" | "settings" | "profile"

interface CorporateSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  currentPage: CorporatePage
  setCurrentPage: (page: CorporatePage) => void
  orgName: string
  orgWebsite?: string
  userImage?: string | null
  userName?: string | null
  userEmail?: string | null
}

export function CorporateSidebar({
  sidebarOpen,
  setSidebarOpen,
  currentPage,
  setCurrentPage,
  orgName,
  orgWebsite,
  userImage,
  userName,
  userEmail,
}: CorporateSidebarProps) {
  const navItems = [
    { id: "overview" as CorporatePage, label: "Overview", imageSrc: "/overview.svg" },
    { id: "events" as CorporatePage, label: "Events", imageSrc: "/13.svg" },
    { id: "history" as CorporatePage, label: "History", imageSrc: "/history.svg" },
    { id: "members" as CorporatePage, label: "Members", imageSrc: "/members.svg" },
    { id: "profile" as CorporatePage, label: "Profile", imageSrc: "/overview.svg" },
    { id: "settings" as CorporatePage, label: "Settings", imageSrc: "/setting.svg" },
  ]

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-46" : "w-20"
          } bg-[#177f60] backdrop-blur-2xl rounded-r-2xl sm:rounded-r-3xl border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm fixed md:sticky md:top-0 min-h-screen md:h-screen z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } overflow-y-auto pb-24 md:overflow-visible md:pb-0`}
      >
        {/* Logo */}
        <div className="p-2 sm:p-3 flex items-center">
          <div className="flex flex-col items-center justify-center w-full">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center">
              <Image
                src="/cflo1.svg"
                alt="CertificateHash Logo"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        

        {/* Navigation */}
        <nav className="flex-1 p-4 pb-6">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setCurrentPage(item.id)
                      if (window.innerWidth < 768) setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentPage === item.id
                      ? "bg-[#428a72] text-white"
                      : "text-white hover:bg-green-800/50"
                      }`}
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.label}
                      width={24}
                      height={24}
                      className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                    />
                    {sidebarOpen && <span className="font-medium text-sm sm:text-base md:text-lg">{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-2">
          <button 
            onClick={() => {
              setCurrentPage("profile")
              if (window.innerWidth < 768) setSidebarOpen(false)
            }}
            className="w-full flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-green-600 transition-colors"
          >
            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 shrink-0">
              {userImage && (
                <AvatarImage src={userImage} alt={userName || "User"} />
              )}
              <AvatarFallback className="bg-[#21808D] text-white text-xs sm:text-sm">
                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 text-left min-w-0 overflow-hidden">
                <p className="text-sm sm:text-base font-medium text-white truncate">{userName || "User"}</p>
              </div>
            )}
          </button>

          {/* Sign out button - shown when sidebar is open, positioned better on mobile */}
          {sidebarOpen && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-red-600 mt-2 font-medium">
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Sign out</span>
            </button>
          )}

          {/* Mobile-only sign out when sidebar closed */}
          {!sidebarOpen && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="md:hidden w-full flex items-center justify-center p-2 rounded-lg hover:bg-red-50 transition-colors text-red-600 mt-2"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </aside>
    </>
  )
}

