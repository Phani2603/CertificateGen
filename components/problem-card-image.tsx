'use client'

import Image from "next/image"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

interface ProblemCardImageProps {
    imageSrc: string
    imageAlt: string
    tag: string
    title: string
    description: string
    className?: string
    variant?: 'glare' | 'pixelated' | 'marquee'
}

export default function ProblemCardImage({
    imageSrc,
    imageAlt,
    tag,
    title,
    description,
    className,
    variant = 'glare'
}: ProblemCardImageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (variant === 'pixelated' && canvasRef.current && imageRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            const img = imageRef.current

            const drawPixelated = () => {
                if (!ctx) return

                canvas.width = img.naturalWidth
                canvas.height = img.naturalHeight

                const pixelSize = 8
                ctx.imageSmoothingEnabled = false

                // Draw scaled down
                ctx.drawImage(img, 0, 0, canvas.width / pixelSize, canvas.height / pixelSize)
                // Scale back up
                ctx.drawImage(canvas, 0, 0, canvas.width / pixelSize, canvas.height / pixelSize, 0, 0, canvas.width, canvas.height)
            }

            if (img.complete) {
                drawPixelated()
            } else {
                img.onload = drawPixelated
            }
        }
    }, [variant])

    return (
        <div className={cn("group flex flex-col p-2 px-2 rounded-[40px] bg-white transition-all duration-500 hover:shadow-xl hover:-translate-y-1", className)}>
            {/* High-quality Image Container with Different Effects */}
            <div className="relative w-full aspect-[15/10] bg-[#F5F5F7] rounded-[32px] overflow-hidden flex items-center justify-center mb-4 transition-all duration-500 group-hover:shadow-inner group-hover:bg-[#f0f0f2]">

                {/* Variant: Glare - Cinematic Sheen/Glint Overlay */}
                {variant === 'glare' && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden rounded-[32px]">
                        <div className="absolute top-0 h-full w-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[150%] skew-x-[-20deg] transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-x-[150%]" />
                    </div>
                )}

                {/* Variant: Pixelated - Mosaic Grid Overlay */}
                {variant === 'pixelated' && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden rounded-[32px]">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {/* Grid overlay effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                            style={{
                                backgroundImage: `
                                    linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .3) 25%, rgba(255, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .3) 75%, rgba(255, 255, 255, .3) 76%, transparent 77%, transparent),
                                    linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .3) 25%, rgba(255, 255, 255, .3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .3) 75%, rgba(255, 255, 255, .3) 76%, transparent 77%, transparent)
                                `,
                                backgroundSize: '8px 8px'
                            }}
                        />
                    </div>
                )}

                {/* Variant: Marquee - Scrolling Shine Bars */}
                {variant === 'marquee' && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden rounded-[32px]">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {/* Multiple animated bars */}
                            <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-white/30 to-transparent animate-marquee-down"
                                style={{ animationDelay: '0s' }} />
                            <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-white/30 to-transparent animate-marquee-down"
                                style={{ animationDelay: '0.3s' }} />
                            <div className="absolute top-0 left-0 w-full h-[20%] bg-gradient-to-b from-white/30 to-transparent animate-marquee-down"
                                style={{ animationDelay: '0.6s' }} />
                        </div>
                    </div>
                )}

                {/* Image with Float & Tilt */}
                <div className="relative w-[65%] h-auto z-20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-3 group-hover:-translate-y-3">
                    <Image
                        ref={imageRef}
                        src={imageSrc}
                        alt={imageAlt}
                        width={400}
                        height={300}
                        className="object-contain w-full h-auto drop-shadow-xl transition-all duration-500 group-hover:drop-shadow-2xl"
                    />
                </div>
            </div>

            <div className="flex flex-col items-start space-y-1 py-2 px-2">
                {/* Tag Pill */}
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FFEFEF] text-[#FF4D4D] text-sm font-semibold tracking-wide">
                    {tag}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-base text-gray-500 leading-relaxed font-medium">
                    {description}
                </p>
            </div>
        </div>
    )
}
