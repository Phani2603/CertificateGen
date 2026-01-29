"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CookieIcon, X } from "lucide-react"
import NeumorphButton from "@/components/ui/neumorph-button"

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem("cookie-consent")
        if (!consent) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem("cookie-consent", "accepted")
        setIsVisible(false)
    }

    const handleReject = () => {
        localStorage.setItem("cookie-consent", "rejected")
        setIsVisible(false)
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] w-[90vw] max-w-[400px]"
                >
                    <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100 relative">
                        <div className="flex flex-col items-start gap-4 mb-4">
                            <div className="text-2xl flex items-center gap-2 shrink-0">
                                <CookieIcon />
                                <p className="font-bold text-gray-900 text-lg">We value your privacy!</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    Our website uses tracking cookies to understand how you interact with it. The tracking will be disabled unless you accept.
                                    <a href="#" className="underline ml-1 hover:text-gray-900">Manage preferences</a>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <NeumorphButton
                                size={"small"}
                                onClick={handleAccept}
                                className="flex-1 bg-black text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Accept all
                            </NeumorphButton>
                            <NeumorphButton
                                size={"small"}
                                onClick={handleReject}
                                className="flex-1 bg-black text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                            >
                                Reject all
                            </NeumorphButton>
                        </div>

                        <div className="mt-4 flex gap-4 text-xs text-gray-500">
                            <a href="#" className="hover:text-gray-900 hover:underline">Privacy Policy</a>
                            <a href="#" className="hover:text-gray-900 hover:underline">Terms of Service</a>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
