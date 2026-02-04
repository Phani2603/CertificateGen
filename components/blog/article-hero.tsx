'use client'

import { motion } from 'motion/react'

export default function ArticleHero() {
    return (
        <section className="max-w-[1200px] mx-auto px-6 py-20 text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
            >
                {/* Title */}
                <h1 className="font-bespoke-serif-medium text-5xl md:text-6xl lg:text-7xl text-gray-900 leading-[1.2] max-w-4xl mx-auto">
                    Insights, News & Best Practices
                </h1>

                {/* Primary CTA */}
                <motion.button
                    className="inline-flex items-center px-8 py-3 rounded-full border border-gray-900 text-gray-900 font-poppins text-sm font-medium hover:bg-gray-900 hover:text-white transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Subscribe to Newsletter
                </motion.button>

                {/* Meta Row */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex items-center justify-center gap-4 flex-wrap text-sm"
                >
                    {/* Tags */}
                    <span className="px-4 py-1.5 rounded-full border border-gray-300 text-gray-700 font-poppins">
                        Technology
                    </span>
                    <span className="px-4 py-1.5 rounded-full border border-gray-300 text-gray-700 font-poppins">
                        Education
                    </span>

                    {/* Separator */}
                    <span className="text-gray-400">•</span>

                    {/* Date */}
                    <span className="text-gray-600 font-rx100">
                        Updated 15 January 2026
                    </span>

                    {/* Separator */}
                    <span className="text-gray-400">•</span>

                    {/* Authors */}
                    <span className="text-gray-600 font-rx100">
                        By Certiflo Team
                    </span>
                </motion.div>
            </motion.div>
        </section>
    )
}
