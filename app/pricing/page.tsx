"use client"

import { Poppins } from "next/font/google"
import MobileNav from "@/components/mobile-nav"
import NewLandingDesktopNav from "@/components/newlanding-desktop-nav"
import ScrollToTop from "@/components/scroll-to-top"
import HeroSectionPricing from "@/components/newlanding/HeroSectionPricing"

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export default function PricingPage() {
    return (
        <div className={`min-h-screen bg-gray-50 relative overflow-hidden ${poppins.className}`}>
            {/* Navigation */}
            <NewLandingDesktopNav />
            <MobileNav />

            {/* Main Content */}
            <main className="relative z-10 pt-24 pb-20">
                <HeroSectionPricing />
            </main>

            {/* Scroll to Top */}
            <ScrollToTop />
        </div>
    )
}
