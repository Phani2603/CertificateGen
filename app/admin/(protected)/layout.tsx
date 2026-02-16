"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Shield,
  LogOut,
  Menu,
  X,
  AlertCircle,
  Settings,
  HelpCircle,
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { TbBuildingBank } from "react-icons/tb";
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getGoogleFontsUrl } from "@/lib/fonts"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Load all fonts on mount
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = getGoogleFontsUrl()
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Organizations",
      href: "/admin/organizations",
      icon: TbBuildingBank,
    },
    {
      title: "Access Requests",
      href: "/admin/requests",
      icon: AlertCircle,
    },
    {
      title: "Suspension Appeals",
      href: "/admin/suspension-appeals",
      icon: Shield,
    },
    {
      title: "Audit Logs",
      href: "/admin/logs",
      icon: FileText,
    },
  ]

  const secondaryNavItems = [
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      disabled: true
    },
    {
      title: "Get Help",
      href: "/admin/help",
      icon: HelpCircle,
      disabled: true
    },
  ]

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 flex font-sans" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-white border-r border-gray-100 flex flex-col shadow-sm",
            isSidebarOpen ? "w-64" : "w-20",
            !isMobileOpen && "-translate-x-full lg:translate-x-0",
            isMobileOpen && "translate-x-0 w-64"
          )}
        >
          {/* Logo */}
          <div className={cn("h-16 flex items-center border-b border-gray-100 bg-white transition-all", isSidebarOpen ? "px-6" : "justify-center px-2")}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 min-w-[32px] bg-[#00D492]/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00D492]" />
              </div>
              <span className={cn("font-bold text-lg tracking-tight text-gray-900 duration-200 whitespace-nowrap", !isSidebarOpen && "opacity-0 w-0")}>
                Admin Portal
              </span>
            </div>
          </div>

          <div className="p-3 flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
            {/* Main Navigation */}
            <div className="space-y-1 mb-6">
              <h4 className={cn("text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-all duration-300", isSidebarOpen ? "px-3" : "text-center scale-0 h-0")}>
                Platform
              </h4>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                            isActive
                              ? "bg-[#00D492]/10 text-[#00D492]"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                            !isSidebarOpen && "justify-center px-2"
                          )}
                        >
                          <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-[#00D492]" : "text-gray-400 group-hover:text-gray-600")} />
                          <span className={cn("transition-all duration-200 whitespace-nowrap", !isSidebarOpen && "opacity-0 w-0 hidden")}>
                            {item.title}
                          </span>

                          {/* Active Indicator Line */}
                          {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00D492] rounded-l-full" />
                          )}
                        </Link>
                      </TooltipTrigger>
                      {!isSidebarOpen && (
                        <TooltipContent side="right" className="bg-gray-900 text-white border-0">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </nav>
            </div>

            <Separator className="my-2 bg-gray-100" />

            {/* Secondary Navigation */}
            <div className="space-y-1 mt-4">
              <h4 className={cn("text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 transition-all duration-300", isSidebarOpen ? "px-3" : "text-center scale-0 h-0")}>
                Support
              </h4>
              {secondaryNavItems.map((item) => {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-not-allowed opacity-50 select-none",
                          "text-gray-400",
                          !isSidebarOpen && "justify-center px-2"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className={cn("transition-all duration-200 whitespace-nowrap", !isSidebarOpen && "opacity-0 w-0 hidden")}>
                          {item.title}
                        </span>
                      </div>
                    </TooltipTrigger>
                    {!isSidebarOpen && (
                      <TooltipContent side="right" className="bg-gray-900 text-white border-0">
                        {item.title} (Disabled)
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          </div>

          {/* Sidebar Toggle Button (Desktop) */}
          <div className="hidden lg:flex items-center justify-end p-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {/* User Profile */}
          <div className={cn("border-t border-gray-100 bg-gray-50/50 transition-all duration-300", isSidebarOpen ? "p-4" : "p-2")}>
            <div className={cn("flex items-center gap-3 rounded-lg hover:bg-white hover:shadow-sm transition-all cursor-pointer group p-2 border border-transparent hover:border-gray-100", !isSidebarOpen && "justify-center")}>
              <Avatar className="h-9 w-9 border border-gray-200">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-[#00D492]/10 text-[#00D492] text-xs font-bold">AD</AvatarFallback>
              </Avatar>
              <div className={cn("flex-1 min-w-0 transition-opacity duration-200", !isSidebarOpen && "opacity-0 w-0 hidden")}>
                <p className="text-sm font-semibold text-gray-900 truncate">System Admin</p>
                <p className="text-xs text-gray-500 truncate">admin@system.com</p>
              </div>

              <DropdownMenuTriggerWrapper onLogout={handleLogout}>
                <div className={cn("p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors", !isSidebarOpen && "hidden")}>
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              </DropdownMenuTriggerWrapper>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={cn("transition-all duration-300 flex-1 flex flex-col min-w-0 bg-gray-50",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}>
          {/* Mobile Header */}
          <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-20 px-4 flex lg:hidden items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00D492]/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00D492]" />
              </div>
              <span className="font-bold text-lg text-gray-900">Admin</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Separate component for the dropdown logic to keep the main component cleaner
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function DropdownMenuTriggerWrapper({ children, onLogout }: { children: React.ReactNode, onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div role="button" tabIndex={0} className="outline-none ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {children}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

