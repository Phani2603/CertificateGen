"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

interface ScrollRevealSectionProps {
    children: React.ReactNode
    className?: string
    offset?: number
}

export default function ScrollRevealSection({ children, className = "", offset = 0.3 }: ScrollRevealSectionProps) {
    const ref = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["0 1", "0.2 1"] // Starts interacting when top of element enters bottom of viewport
    })

    // Fade in
    const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])

    // Slight scale up (0.95 -> 1)
    const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1])

    // Slight slide up for that "reveal" feel
    const y = useTransform(scrollYProgress, [0, 1], [50, 0])

    return (
        <motion.div
            ref={ref}
            style={{ opacity, scale, y }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
