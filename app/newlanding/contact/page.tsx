"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Caveat, Poppins, Raleway, Pacifico } from "next/font/google"

import { Mail, MapPin, Send } from "lucide-react"
import SiteFooterGlassmorphism from "@/components/site-footer-glassmorphism"
import MobileNav from "@/components/mobile-nav"
import NewLandingDesktopNav from "@/components/newlanding-desktop-nav"
import ScrollToTop from "@/components/scroll-to-top"
import { Button } from "@/components/ui/button"

// Fonts
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })
const raleway = Raleway({ subsets: ["latin"], weight: ["400", "600", "700"] })
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"] })

export default function ContactPage() {
    const [formState, setFormState] = useState({
        name: "",
        email: "",
        message: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle form submission
        console.log("Form submitted:", formState)
    }

    return (
        <div className={`min-h-screen bg-gray-50 relative overflow-hidden ${poppins.className}`}>
            {/* Background Pattern Removed */}

            {/* Navigation */}
            <NewLandingDesktopNav />

            <MobileNav />

            {/* Main Content */}
            <main className="relative z-10 pt-32 pb-20 px-6 lg:px-12 max-w-7xl mx-auto min-h-screen flex items-center">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 w-full">
                    {/* Left Column: Form */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-[52px] font-bespoke-serif-extrabold tracking-tight text-black">
                                Contact
                            </h1>
                            <p className="text-xl lg:text-2xl lg:font-medium font-playfair  text-gray-600 max-w-md">
                                Ready to join Certiflo? Have questions? We'd love to hear from you.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 font-playfair mt-12">
                            <div className="space-y-2 font-playfair relative group">
                                <label className="text-lg font-bold text-gray-500 uppercase tracking-widest">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Your name"
                                    value={formState.name}
                                    onChange={handleChange}
                                    className="w-full bg-transparent border-b border-gray-200 py-3 text-lg focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-300"
                                />
                            </div>

                            <div className="space-y-2 relative">
                                <label className="text-lg font-bold text-gray-500 uppercase tracking-widest">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="your@email.com"
                                    value={formState.email}
                                    onChange={handleChange}
                                    className="w-full bg-transparent border-b border-gray-200 py-3 text-lg focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-300"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-lg font-bold text-gray-500 uppercase tracking-widest">Message</label>
                                <textarea
                                    name="message"
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    value={formState.message}
                                    onChange={handleChange}
                                    className="w-full bg-transparent border-b border-gray-200 py-3 text-lg focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-300 resize-none"
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="bg-emerald-500 text-white rounded-lg px-8 py-6 text-sm font-semibold hover:bg-emerald-600 hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    Send Message <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Info */}
                    <div className="space-y-16 font-playfair lg:pt-32">
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-4">Email</h3>
                            <a href="mailto:hello@gocertiflo.com" className="flex items-center gap-3 text-2xl lg:text-xl font-bold  hover:opacity-80 transition-opacity">
                                <Mail className="w-6 h-6 lg:w-8 text-emerald-500 lg:h-8" />
                                hello@gocertiflo.com
                            </a>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-400 font-playfair uppercase tracking-widest mb-4">Location</h3>
                            <div className="flex items-start gap-4">
                                <MapPin className="w-6 h-6 text-emerald-600 mt-1 shrink-0" />
                                <div className="text-gray-600 text-lg leading-relaxed">
                                    <p className="font-semibold text-gray-900">Senement HQ</p>
                                    <p>Hyderabad</p>
                                    <p>Telangana, India</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-4">Follow Us</h3>
                            <div className="flex items-center gap-6">
                                <a href="#" className="flex items-center gap-2 text-emerald-500 font-medium hover:underline text-lg">
                                    LinkedIn <span className="w-1.5 h-1.5 bg-emerald-200 rounded-full"></span>
                                </a>
                                <a href="#" className="flex items-center gap-2 text-emerald-600 font-medium hover:underline text-lg">
                                    Instagram
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <SiteFooterGlassmorphism />
            <ScrollToTop />
        </div>
    )
}
