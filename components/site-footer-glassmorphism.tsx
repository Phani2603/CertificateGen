"use client"

import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"
import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

export default function SiteFooterGlassmorphism() {
    const footerRef = useRef<HTMLElement>(null)
    const brandRef = useRef<HTMLDivElement>(null)
    const pagesRef = useRef<HTMLDivElement>(null)
    const socialsRef = useRef<HTMLDivElement>(null)
    const legalRef = useRef<HTMLDivElement>(null)
    const dividerRef = useRef<HTMLDivElement>(null)
    const wordmarkRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: footerRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
            }
        })

        tl.from([brandRef.current, pagesRef.current, socialsRef.current, legalRef.current], {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out"
        })
            .from(dividerRef.current, {
                scaleX: 0,
                opacity: 0,
                duration: 1,
                ease: "expo.out"
            }, "-=0.4")
            .from(wordmarkRef.current, {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power4.out"
            }, "-=0.8")

    }, { scope: footerRef })

    return (
        <footer ref={footerRef} className="relative bg-[#F9FAFB] overflow-hidden font-poppins text-black">
            {/* BACKGROUND COLOR BLOBS */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-30 left-1/3 h-[520px] w-[520px] rounded-full bg-green-200/10 blur-[160px]" />
                <div className="absolute top-40 right-2/4 h-[420px] w-[420px] rounded-full bg-green-600/10 blur-[160px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16">
                {/* MAIN GLASS SURFACE */}
                <div className="relative rounded-3xl glas   s-surface-light overflow-hidden px-8 py-14 lg:px-14 border border-gray-200/50 shadow-sm">
                    {/* GLASS EFFECTS */}
                    <div className="glass-highlight" />
                    <div className="glass-noise opacity-[0.03]" />

                    {/* GRID */}
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 mb-20">
                        {/* BRAND — FLOATING PANEL */}
                        <div ref={brandRef} className="glass-panel-light glass-motion rounded-2xl p-6 space-y-6 bg-white/40 border border-white/60 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Image
                                    src="/cflo1.svg"
                                    alt="Certiflo logo"
                                    width={52}
                                    height={52}
                                    priority
                                    className="invert-0"
                                />
                                <span className="text-xl font-bold tracking-widest text-black">
                                    CERTIFLO
                                </span>
                            </div>

                            <p className="text-base text-gray-700 leading-relaxed font-medium">
                                Secure. Scalable. Simple.
                            </p>

                            <div className="text-sm text-gray-600 space-y-1 font-medium">
                                <p>© {new Date().getFullYear()} Certiflo.</p>
                                <p>All rights reserved.</p>
                            </div>
                        </div>

                        {/* PAGES — FLAT (INTENTIONAL CONTRAST) */}
                        <div ref={pagesRef} className="lg:pl-12">
                            <FooterTitle>Pages</FooterTitle>
                            <FooterList>
                                <FooterLink href="#">Pricing</FooterLink>
                                <FooterLink href="#">Features</FooterLink>
                                <FooterLink href="#">Contact</FooterLink>
                                <FooterLink href="#">Blog</FooterLink>
                            </FooterList>
                        </div>

                        {/* SOCIALS — FLOATING PANEL */}
                        <div ref={socialsRef} className="glass-panel-light glass-motion rounded-2xl p-6 bg-white/40 border border-white/60 shadow-sm">
                            <FooterTitle>Socials</FooterTitle>
                            <ul className="space-y-4">
                                <SocialLink href="#" label="WhatsApp" icon="/whatsapp-icon.svg" />
                                <SocialLink href="#" label="Instagram" icon="/instagram-icon.svg" />
                                <SocialLink href="#" label="X" icon="/x.svg" />
                                <SocialLink href="#" label="LinkedIn" icon="/linkedin.svg" />
                            </ul>
                        </div>

                        {/* LEGAL — FLAT */}
                        <div ref={legalRef}>
                            <FooterTitle>Legal</FooterTitle>
                            <FooterList>
                                <FooterLink href="#">Privacy Policy</FooterLink>
                                <FooterLink href="#">Terms of Service</FooterLink>
                                <FooterLink href="#">Cookie Policy</FooterLink>
                            </FooterList>
                        </div>
                    </div>

                    {/* DIVIDER */}
                    <div ref={dividerRef} className="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-gray-900/10 to-transparent mb-10" />

                    {/* WORDMARK */}
                    <div ref={wordmarkRef} className="relative z-10 flex justify-center">
                        <h1 className="text-[11vw] font-black tracking-tighter leading-none text-gray-900/[0.03] select-none pointer-events-none">
                            CERTIFLO
                        </h1>
                    </div>
                </div>
            </div>
        </footer>
    )
}

/* =========================
   REUSABLE COMPONENTS
========================= */

type FooterTitleProps = {
    children: ReactNode
}

function FooterTitle({ children }: FooterTitleProps) {
    return (
        <h3 className="mb-8 text-lg font-bold uppercase tracking-widest text-black/80">
            {children}
        </h3>
    )
}

type FooterListProps = {
    children: ReactNode
}

function FooterList({ children }: FooterListProps) {
    return (
        <ul className="space-y-4 text-lg text-gray-700 font-medium">
            {children}
        </ul>
    )
}

type FooterLinkProps = {
    href: string | URL
    children: ReactNode
}

function FooterLink({ href, children }: FooterLinkProps) {
    return (
        <li>
            <Link
                href={href}
                className="transition-all duration-200 hover:text-black hover:translate-x-0.5 inline-block"
            >
                {children}
            </Link>
        </li>
    )
}

type SocialLinkProps = {
    href: string | URL
    label: string
    icon: string
}

function SocialLink({ href, label, icon }: SocialLinkProps) {
    return (
        <li>
            <Link
                href={href}
                className="group flex items-center gap-3 text-lg text-gray-700 transition-all duration-200 hover:text-black"
            >
                <div className="relative w-5 h-5 opacity-70 group-hover:opacity-100 transition">
                    <Image
                        src={icon}
                        alt={label}
                        fill
                        className="object-contain"
                    />
                </div>
                {label}
            </Link>
        </li>
    )
}