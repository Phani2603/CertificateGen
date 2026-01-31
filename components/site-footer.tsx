"use client"

import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"

/* =========================
   MAIN FOOTER COMPONENT
========================= */

export default function SiteFooter() {
    return (
        <footer className="relative bg-black text-white overflow-hidden">
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-14">

                {/* TOP GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 mb-24">

                    {/* BRAND */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/cflo1.svg"
                                alt="Certiflo logo"
                                width={52}
                                height={52}
                                priority
                            />
                            <span className="text-xl font-bold tracking-widest">
                                CERTIFLO
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                            Secure. Scalable. Simple.
                        </p>

                        <div className="text-xs text-gray-600 space-y-1">
                            <p>© {new Date().getFullYear()} Certiflo.</p>
                            <p>All rights reserved.</p>
                        </div>
                    </div>

                    {/* PAGES */}
                    <div className="lg:pl-12">
                        <FooterTitle>Pages</FooterTitle>
                        <FooterList>
                            <FooterLink href="#">Pricing</FooterLink>
                            <FooterLink href="#">Features</FooterLink>
                            <FooterLink href="#">Contact</FooterLink>
                            <FooterLink href="#">Blog</FooterLink>
                        </FooterList>
                    </div>

                    {/* SOCIALS */}
                    <div>
                        <FooterTitle>Socials</FooterTitle>
                        <ul className="space-y-4">
                            <SocialLink href="#" label="WhatsApp" icon="/socials/whatsapp.svg" />
                            <SocialLink href="#" label="Instagram" icon="/socials/instagram.svg" />
                            <SocialLink href="#" label="X" icon="/socials/x.svg" />
                            <SocialLink href="#" label="LinkedIn" icon="/socials/linkedin.svg" />
                        </ul>
                    </div>

                    {/* LEGAL */}
                    <div>
                        <FooterTitle>Legal</FooterTitle>
                        <FooterList>
                            <FooterLink href="#">Privacy Policy</FooterLink>
                            <FooterLink href="#">Terms of Service</FooterLink>
                            <FooterLink href="#">Cookie Policy</FooterLink>
                        </FooterList>
                    </div>
                </div>

                {/* GIANT WORDMARK */}
                <div className="relative border-t border-gray-900 pt-16 flex justify-center">
                    <h1 className="text-[13vw] font-black tracking-tighter leading-none text-[#0f0f0f] select-none pointer-events-none">
                        CERTIFLO
                    </h1>
                </div>

            </div>
        </footer>
    )
}

/* =========================
   SMALL REUSABLE COMPONENTS
========================= */

type FooterTitleProps = {
    children: ReactNode
}

function FooterTitle({ children }: FooterTitleProps) {
    return (
        <h3 className="mb-8 text-xs font-bold uppercase tracking-widest text-white">
            {children}
        </h3>
    )
}

type FooterListProps = {
    children: ReactNode
}

function FooterList({ children }: FooterListProps) {
    return (
        <ul className="space-y-4 text-sm text-gray-400 font-medium">
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
                className="hover:text-white transition-colors duration-200"
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
                className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-all duration-200 group"
            >
                <Image
                    src={icon}
                    alt={label}
                    width={18}
                    height={18}
                    className="opacity-70 group-hover:opacity-100 transition"
                />
                {label}
            </Link>
        </li>
    )
}