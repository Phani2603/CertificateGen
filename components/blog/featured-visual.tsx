'use client'

import { motion } from 'motion/react'
import Image from 'next/image'

export default function FeaturedVisual() {
    return (
        <motion.div
            className="relative w-full max-w-[1100px] mx-auto rounded-[24px] overflow-hidden"
            style={{ aspectRatio: '16/9' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
        >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" />

            {/* Floating Abstract Shapes */}
            <motion.div
                className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"
                animate={{
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute bottom-20 right-20 w-40 h-40 bg-yellow-300/30 rounded-full blur-2xl"
                animate={{
                    y: [0, 20, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Floating 3D Objects */}
            <motion.div
                className="absolute top-1/4 right-1/4 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
                animate={{
                    rotate: [0, 10, -10, 0],
                    y: [0, -15, 0],
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ transform: 'perspective(1000px) rotateX(15deg)' }}
            />

            {/* Floating Clock Element */}
            <motion.div
                className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full border-4 border-white/30 flex items-center justify-center"
                animate={{
                    rotate: 360,
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                <div className="w-1 h-6 bg-white/80 rounded-full origin-bottom" style={{ transform: 'translateY(-6px)' }} />
            </motion.div>

            {/* Portrait Cutouts - Simulated with circles */}
            <motion.div
                className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full border-4 border-white/40"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
            />

            <motion.div
                className="absolute top-1/3 right-1/3 w-28 h-28 bg-gradient-to-br from-pink-400 to-red-500 rounded-full border-4 border-white/40"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
            />

            {/* Central Content */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="text-center text-white z-10"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                >
                    <h2 className="font-bespoke-serif-bold text-5xl md:text-6xl mb-4">
                        Insights & Stories
                    </h2>
                    <p className="font-rx100 text-lg md:text-xl text-white/90">
                        Exploring the future of digital credentials
                    </p>
                </motion.div>
            </div>

            {/* Depth Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </motion.div>
    )
}
