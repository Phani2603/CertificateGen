"use client"

import { Caveat } from "next/font/google"
import { cn } from "@/lib/utils"

const caveat = Caveat({
    subsets: ["latin"],
    weight: ["400", "700"]
})

export default function ReadyToStart() {
    return (
        <div className="w-full py-24 flex flex-col items-center justify-center text-center px-4 relative z-10">
            <div className="relative inline-block transform -rotate-1">
                <span className={cn(
                    caveat.className,
                    "relative z-10 text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 px-8 py-3 bg-[#fef08a] rounded-full inline-block shadow-sm"
                )}>
                    Ready To Start ?
                </span>
            </div>

            <p className={cn(
                caveat.className,
                "mt-8 text-2xl sm:text-3xl lg:text-4xl text-gray-800 max-w-3xl leading-relaxed font-semibold"
            )}>
                Join Hundreds Of Organizations Already Using Certiflo To Create And Verify
                <br className="hidden sm:block" /> Professional Certificates.
            </p>

            <button className="mt-10 px-10 py-4 bg-[#34D399] hover:bg-[#10B981] text-white rounded-lg font-poppins font-medium text-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                Join Now
            </button>
        </div>
    )
}
