'use client'

import Link from 'next/link'
import { motion } from 'motion/react'

export default function BlogNav() {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full bg-white border-b border-gray-200"
        >
            <div className="max-w-[1200px] mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="font-bespoke-serif-bold text-2xl text-gray-900">
                            Certiflo
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link
                            href="/blog"
                            className="font-poppins text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200"
                        >
                            Blog
                        </Link>
                        <Link
                            href="/newlanding/hero-section"
                            className="font-poppins text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        >
                            Home
                        </Link>
                        <Link
                            href="/newlanding/contact"
                            className="font-poppins text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        >
                            Contact
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <Link
                            href="/"
                            className="font-poppins text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                        >
                            Menu
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    )
}
