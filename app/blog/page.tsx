'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import FilterTabs from '@/components/blog/filter-tabs'
import RecentPosts from '@/components/blog/recent-posts'
import SiteFooterGlassmorphism from '@/components/site-footer-glassmorphism'
import ScrollToTop from '@/components/scroll-to-top'
import NewLandingDesktopNav from '@/components/newlanding-desktop-nav'
import MobileNav from '@/components/mobile-nav'
import AnimatedContent from '@/components/AnimatedContent'

// Sample blog posts data
const blogPosts = [
    {
        id: 1,
        title: "The Future of Digital Credentials: Blockchain and Beyond",
        excerpt: "Exploring how blockchain technology is revolutionizing the way we issue and verify digital certificates.",
        date: "15 January 2026",
        author: "Sarah Johnson",
        tags: ["Insights", "Best practices"],
        image: "/blog/blockchain-credentials.jpg",
        category: "Insights"
    },
    {
        id: 2,
        title: "5 Best Practices for Certificate Design",
        excerpt: "Learn the essential principles of creating professional, secure, and visually appealing certificates.",
        date: "10 January 2026",
        author: "Michael Chen",
        tags: ["Best practices"],
        image: "/blog/certificate-design.jpg",
        category: "Best practices"
    },
    {
        id: 3,
        title: "Certiflo Launches New Verification API",
        excerpt: "Introducing our latest API that makes certificate verification faster and more secure than ever.",
        date: "5 January 2026",
        author: "Emily Rodriguez",
        tags: ["News"],
        image: "/blog/api-launch.jpg",
        category: "News"
    },
    {
        id: 4,
        title: "How Universities Are Embracing Digital Certificates",
        excerpt: "A deep dive into how educational institutions are transitioning to digital credential systems.",
        date: "28 December 2025",
        author: "David Park",
        tags: ["Insights"],
        image: "/blog/universities-digital.jpg",
        category: "Insights"
    },
    {
        id: 5,
        title: "Security Best Practices for Certificate Management",
        excerpt: "Essential security measures every organization should implement when managing digital certificates.",
        date: "20 December 2025",
        author: "Sarah Johnson",
        tags: ["Best practices", "Insights"],
        image: "/blog/security-practices.jpg",
        category: "Best practices"
    },
    {
        id: 6,
        title: "Certiflo Reaches 100,000 Certificates Milestone",
        excerpt: "Celebrating a major milestone as we continue to grow and serve organizations worldwide.",
        date: "15 December 2025",
        author: "Emily Rodriguez",
        tags: ["News"],
        image: "/blog/milestone.jpg",
        category: "News"
    }
]

export default function BlogPage() {
    const [activeFilter, setActiveFilter] = useState('All')

    const filteredPosts = activeFilter === 'All'
        ? blogPosts
        : blogPosts.filter(post => post.category === activeFilter)

    return (
        <div className="min-h-screen bg-white">
            {/* Blog Navigation - No Auth Buttons */}
            <NewLandingDesktopNav hideAuth />
            <MobileNav hideAuth />

            {/* Header Section - More Spacing */}
            <section className="max-w-[1200px] mx-auto px-6 pt-32 pb-20 mb-10">
                <AnimatedContent distance={30} duration={0.8} delay={0.1}>
                    <div className="text-center space-y-6">
                        <p className="font-poppins text-lg font-semibold text-gray-600 tracking-wide pb-10">
                            Official news and insights
                        </p>
                        <h1 className="font-bespoke-serif-bold text-5xl md:text-6xl lg:text-7xl text-gray-900">
                            Certiflo Blog <span className="text-primary">.</span>
                        </h1>
                    </div>
                </AnimatedContent>
            </section>

            {/* Filter Tabs Section */}
            <section className="max-w-[1200px] mx-auto px-6 pb-16">
                <AnimatedContent distance={20} delay={0.2}>
                    <FilterTabs
                        activeFilter={activeFilter}
                        setActiveFilter={setActiveFilter}
                    />
                </AnimatedContent>
            </section>

            {/* Blog Posts Grid - Constrained Width */}
            <section className="max-w-[85%] mx-auto px-6 pb-24">
                <AnimatedContent distance={30} delay={0.3}>
                    <RecentPosts posts={filteredPosts} />
                </AnimatedContent>
            </section>

            {/* Footer */}
            <SiteFooterGlassmorphism />

            {/* Scroll to Top Button */}
            <ScrollToTop />
        </div>
    )
}
