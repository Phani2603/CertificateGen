"use client"

import Link from "next/link"
import { Raleway, Pacifico } from "next/font/google"
import { usePathname } from "next/navigation"

const raleway = Raleway({ subsets: ["latin"], weight: ["400", "600", "700"] })
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"] })

interface NewLandingDesktopNavProps {
    hideAuth?: boolean
}

export default function NewLandingDesktopNav({ hideAuth = false }: NewLandingDesktopNavProps) {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <nav className={`hidden md:flex ${hideAuth ? 'relative' : 'fixed'} top-0 left-0 right-0 w-full z-50 items-center justify-between px-6 py-4 lg:px-12 bg-transparent pointer-events-none`}>
            {/* LOGO */}
            <div className="pointer-events-auto">
                <Link href="/newlanding/hero-section" className="flex flex-col items-center cursor-pointer group">
                    <div className={`text-2xl font-semibold text-gray-900 ${raleway.className} group-hover:opacity-80 transition-opacity`}>
                        Certiflo
                    </div>
                    <div className={`text-sm text-gray-600 font-medium ${pacifico.className} group-hover:opacity-80 transition-opacity`}>
                        by SENEMENT
                    </div>
                </Link>
            </div>

            {/* DESKTOP CENTER LINKS */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center space-x-1 bg-white p-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-100 pointer-events-auto">
                <Link
                    href="https://gocertiflo.com/newlanding/hero-section"
                    className="text-gray-600 hover:text-black px-5 py-2 rounded-full hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                >
                    Home
                </Link>
                <Link
                    href="/"
                    className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${isActive("/") ? "text-black bg-gray-50 shadow-sm" : "text-gray-600 hover:text-black hover:bg-gray-50"
                        }`}
                >
                    Pricing
                </Link>
                <Link
                    href="/verify"
                    className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${isActive("/verify") ? "text-black bg-gray-50 shadow-sm" : "text-gray-600 hover:text-black hover:bg-gray-50"
                        }`}
                >
                    Verify
                </Link>
                <Link
                    href="/newlanding/contact"
                    className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${isActive("/newlanding/contact") ? "text-black bg-gray-50 shadow-sm" : "text-gray-600 hover:text-black hover:bg-gray-50"
                        }`}
                >
                    Contact
                </Link>
                <Link
                    href="/blog"
                    className={`px-5 py-2 rounded-full transition-all duration-200 text-sm font-medium ${isActive("/blog") ? "text-black bg-gray-50 shadow-sm" : "text-gray-600 hover:text-black hover:bg-gray-50"
                        }`}
                >
                    Blog
                </Link>
            </div>

            {/* DESKTOP RIGHT ACTIONS - Conditionally Hidden */}
            {!hideAuth && (
                <div className="hidden md:flex items-center gap-3 pointer-events-auto">
                    <button className="px-5 py-2 text-sm font-semibold text-gray-700 hover:text-black transition-colors">
                        Login
                    </button>
                    <button className="px-5 py-2 text-sm font-semibold text-white bg-black rounded-full hover:bg-gray-800 transition-colors shadow-lg active:scale-95 transform duration-100">
                        Join Now
                    </button>
                </div>
            )}
        </nav>
    )
}
