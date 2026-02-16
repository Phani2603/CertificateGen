"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

interface MobileNavProps {
    hideAuth?: boolean
}

export default function MobileNav({ hideAuth = false }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (!contentRef.current) return

        gsap.to(contentRef.current, {
            height: isOpen ? "auto" : 0,
            opacity: isOpen ? 1 : 0,
            y: isOpen ? 0 : -8,
            duration: 0.35,
            ease: "power3.out",
            pointerEvents: isOpen ? "auto" : "none"
        })
    }, [isOpen])

    return (
        <div className="md:hidden fixed top-4 left-4 right-4 z-50 font-poppins">
            {/* OUTER SHELL (NEVER ANIMATES) */}
            <div className="bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">

                {/* HEADER */}
                <div className="flex items-center justify-between px-2 py-1">
                    <Link href="/" onClick={() => setIsOpen(false)} className="group">
                        <div className="text-lg font-bold text-gray-900 font-raleway group-hover:opacity-80 transition-opacity leading-none">
                            Certiflo
                        </div>
                        <div className="text-[7px] text-gray-500 font-medium font-pacifico group-hover:opacity-80 transition-opacity leading-none mt-0.5">
                            by SENEMENT
                        </div>
                    </Link>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="bg-gray-50 hover:bg-gray-100 rounded-full p-2 active:scale-95 transition"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* SLIDING CONTENT */}
                <div
                    ref={contentRef}
                    className="h-0 opacity-0 overflow-hidden"
                >
                    <div className="px-5 pb-6 space-y-6">
                        <div className="h-px w-full bg-gray-100" />

                        <nav className="flex flex-col space-y-4">
                            <Link href="#" className="text-lg font-medium text-gray-600 hover:text-black transition-colors">Home</Link>
                            <Link href="https://semenent.com" target="_blank" className="text-lg font-medium text-gray-600 hover:text-black transition-colors">Semenent</Link>
                            <Link href="/newlanding/pricing" className="text-lg font-medium text-gray-600 hover:text-black transition-colors">Pricing</Link>
                            <Link href="/verify" className="text-lg font-medium text-gray-600 hover:text-black transition-colors">Verify</Link>
                            <Link href="/newlanding/contact" className="text-lg font-medium text-gray-600 hover:text-black transition-colors">Contact</Link>
                            <Link href="/blog" className="text-lg font-medium text-gray-600 hover:text-black transition-colors">Blog</Link>
                        </nav>

                        {/* Auth Buttons - Conditionally Hidden */}
                        {!hideAuth && (
                            <div className="flex flex-col gap-3">
                                <Link href="/signup" onClick={() => setIsOpen(false)}>
                                    <button className="w-full bg-black text-white rounded-xl py-3 text-base font-bold shadow-md active:scale-95 transition-transform">
                                        Join Now
                                    </button>
                                </Link>
                                <Link href="/login" onClick={() => setIsOpen(false)}>
                                    <button className="w-full bg-gray-50 text-gray-900 rounded-xl py-3 text-base font-bold hover:bg-gray-100 active:scale-95 transition-transform">
                                        Login
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
