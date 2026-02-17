"use client"

import Link from "next/link"
import { Mail } from "lucide-react"

export function MinimalFooter() {
  return (
    <footer className="w-full ">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
          {/* Email */}
          <a 
            href="mailto:support@gocertiflo.com" 
            className="flex items-center gap-1 hover:text-[#21808D] transition-colors"
          >
            <Mail className="w-3 h-3" />
            <span>support@gocertiflo.com</span>
          </a>

          {/* Divider */}
          <span className="hidden sm:inline text-gray-300">|</span>

          {/* All Rights Reserved */}
          <span className="text-gray-500">
            © {new Date().getFullYear()} Certiflo. All rights reserved.
          </span>

          {/* Divider */}
          <span className="hidden sm:inline text-gray-300">|</span>

          {/* Privacy Policy Link */}
          <Link 
            href="/privacy-policy" 
            className="hover:text-[#21808D] transition-colors underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
