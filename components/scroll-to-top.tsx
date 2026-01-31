"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    useEffect(() => {
        window.addEventListener("scroll", toggleVisibility)
        return () => {
            window.removeEventListener("scroll", toggleVisibility)
        }
    }, [])

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <button
                onClick={scrollToTop}
                className={cn(
                    "bg-black text-white px-6 py-3 rounded-full flex items-center gap-2 text-xs font-bold tracking-wider hover:bg-gray-800 transition-all duration-300 uppercase shadow-lg transform",
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
                )}
            >
                Scroll Up <ArrowUp size={14} className="stroke-[3px]" />
            </button>
        </div>
    )
}
