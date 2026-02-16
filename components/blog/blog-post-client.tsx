'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import NewLandingDesktopNav from '@/components/newlanding-desktop-nav'
import MobileNav from '@/components/mobile-nav'
import SiteFooterGlassmorphism from '@/components/site-footer-glassmorphism'
import ScrollToTop from '@/components/scroll-to-top'
import ImageModal from '@/components/problem-card-image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ProblemCardImage from '@/components/problem-card-image'
import AnimatedContent from '@/components/AnimatedContent'
import ScrollReveal from '@/components/ScrollReveal'
import React from 'react'

interface BlogPostClientProps {
    content: string
    frontmatter: {
        title: string
        date: string
        author: string
        authorRole?: string
        readTime?: string
        tags?: string[]
        image?: string
    }
    id: string
}

// Related posts images 
const relatedImages = [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
]

// Helper to extract plain text from React children to avoid [object Object] errors in ScrollReveal
const extractText = (children: React.ReactNode): string => {
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return String(children);
    if (Array.isArray(children)) return children.map(extractText).join('');
    if (React.isValidElement(children)) {
        const element = children as React.ReactElement<{ children?: React.ReactNode }>;
        if (element.props.children) {
            return extractText(element.props.children);
        }
    }
    return '';
};

export default function BlogPostClient({ content, frontmatter, id }: BlogPostClientProps) {
    return (
        <div className="min-h-screen bg-white">
            {/* Blog Navigation - No Auth Buttons */}
            <NewLandingDesktopNav hideAuth />
            <MobileNav hideAuth />

            {/* Back Button */}
            <div className="max-w-[90%] mx-auto px-6 py-8">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 font-poppins"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blog
                </Link>
            </div>

            {/* Article Content */}
            <article className="w-full pb-20">
                <div className="space-y-12">
                    {/* Header Section - 70% Width */}
                    <div className="w-[70%] mx-auto space-y-8 px-6 text-center">
                        <AnimatedContent distance={20} delay={0.1}>
                            {/* Meta Info - Centered */}
                            <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
                                {frontmatter.tags?.[0] && (
                                    <span className="px-4 py-1.5 rounded-full border border-gray-300 text-gray-700 font-poppins">
                                        {frontmatter.tags[0]}
                                    </span>
                                )}
                                <span className="text-gray-400">•</span>
                                <span className="font-rx100 text-gray-600">{frontmatter.date}</span>
                                <span className="text-gray-400">•</span>
                                <span className="font-rx100 text-gray-600">{frontmatter.readTime}</span>
                            </div>
                        </AnimatedContent>

                        {/* Title - Centered - Using ScrollReveal for Title */}
                        <div className='flex justify-center'>
                            <ScrollReveal
                                baseRotation={3}
                                blurStrength={6}
                                textClassName="font-bespoke-serif-medium text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-[1.2] text-center"
                            >
                                {frontmatter.title}
                            </ScrollReveal>
                        </div>

                        {/* Author - Updated to U Senthil Kumar */}
                        <AnimatedContent distance={20} delay={0.3}>
                            <div className="flex items-center justify-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                                    <Image
                                        src="/members.svg"
                                        alt="U Varun Kumar"
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-left">
                                    <p className="font-poppins font-medium text-gray-900">U Varun Kumar</p>
                                    <p className="font-rx100 text-sm text-gray-600">Product manager at gocertiflo</p>
                                </div>
                            </div>
                        </AnimatedContent>
                    </div>

                    {/* Featured Image - Refined Animation */}
                    {frontmatter.image && (
                        <div className="w-[70%] mx-auto">
                            <AnimatedContent
                                distance={0}
                                scale={1.1}
                                initialOpacity={0}
                                duration={1.2}
                                delay={0.2}
                                className="overflow-hidden rounded-2xl shadow-sm"
                            >
                                <div style={{ aspectRatio: '16/9' }}>
                                    <Image
                                        src={frontmatter.image}
                                        alt={frontmatter.title}
                                        width={1400}
                                        height={788}
                                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            </AnimatedContent>
                        </div>
                    )}

                    {/* Main Content - Markdown */}
                    <div className="w-full mx-auto px-6">
                        <div className="prose prose-lg max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Paragraphs: Subtle fade-in
                                    p: ({ children }) => (
                                        <div className="w-[55%] mx-auto mb-6">
                                            <AnimatedContent
                                                distance={10}
                                                direction="vertical"
                                                duration={0.8}
                                                threshold={0.1}
                                                initialOpacity={0}
                                            >
                                                <p className="font-rx100 text-xl md:text-2xl text-gray-700 leading-[1.6]">
                                                    {children}
                                                </p>
                                            </AnimatedContent>
                                        </div>
                                    ),
                                    // Headings: Use extractText to prevent [object Object] error
                                    h1: ({ children }) => (
                                        <div className="w-[55%] mx-auto mt-12 mb-6 text-center flex justify-center">
                                            <ScrollReveal
                                                baseRotation={5}
                                                blurStrength={10}
                                                textClassName="font-bespoke-serif-medium text-4xl text-gray-900"
                                            >
                                                {extractText(children)}
                                            </ScrollReveal>
                                        </div>
                                    ),
                                    h2: ({ children }) => (
                                        <div className="w-[55%] mx-auto mt-12 mb-4 text-center flex justify-center">
                                            <ScrollReveal
                                                baseRotation={3}
                                                blurStrength={5}
                                                textClassName="font-poppins text-3xl font-semibold text-gray-900"
                                            >
                                                {extractText(children)}
                                            </ScrollReveal>
                                        </div>
                                    ),
                                    h3: ({ children }) => (
                                        <div className="w-[55%] mx-auto mt-8 mb-4 flex justify-center">
                                            <ScrollReveal
                                                baseRotation={2}
                                                blurStrength={3}
                                                textClassName="font-poppins text-2xl font-semibold text-gray-900"
                                            >
                                                {extractText(children)}
                                            </ScrollReveal>
                                        </div>
                                    ),
                                    // Lists
                                    ul: ({ children }) => (
                                        <div className="w-[55%] mx-auto mb-6 pl-6">
                                            <AnimatedContent distance={15} delay={0.1}>
                                                <ul className="list-disc font-rx100 text-xl md:text-2xl text-gray-700 leading-[1.6]">
                                                    {children}
                                                </ul>
                                            </AnimatedContent>
                                        </div>
                                    ),
                                    ol: ({ children }) => (
                                        <div className="w-[55%] mx-auto mb-6 pl-6">
                                            <AnimatedContent distance={15} delay={0.1}>
                                                <ol className="list-decimal font-rx100 text-xl md:text-2xl text-gray-700 leading-[1.6]">
                                                    {children}
                                                </ol>
                                            </AnimatedContent>
                                        </div>
                                    ),
                                    // Images
                                    img: ({ src, alt }) => (
                                        <div className="w-[70%] mx-auto my-12">
                                            <AnimatedContent
                                                distance={30}
                                                scale={0.98}
                                                duration={0.8}
                                                threshold={0.1}
                                            >
                                                <div className="rounded-xl overflow-hidden shadow-lg">
                                                    <img
                                                        src={src}
                                                        alt={alt}
                                                        className="w-full h-auto object-cover"
                                                    />
                                                </div>
                                            </AnimatedContent>
                                        </div>
                                    ),
                                    // Code Blocks
                                    code: ({ className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '')
                                        const isBlock = match || String(children).includes('\n')

                                        if (isBlock) {
                                            return (
                                                <div className="w-[55%] mx-auto my-8">
                                                    <AnimatedContent distance={15} scale={0.99} duration={0.6}>
                                                        <div className="bg-[#1e1e1e] rounded-xl p-6 overflow-x-auto shadow-2xl border border-gray-800">
                                                            <code className={`${className} font-mono text-sm text-gray-300 block`} {...props}>
                                                                {children}
                                                            </code>
                                                        </div>
                                                    </AnimatedContent>
                                                </div>
                                            )
                                        }
                                        return (
                                            <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    // Blockquote: Use ScrollReveal
                                    blockquote: ({ children }) => (
                                        <div className="w-[55%] mx-auto my-10 border-l-4 border-gray-900 pl-6 py-2">
                                            <ScrollReveal
                                                baseRotation={2}
                                                blurStrength={2}
                                                textClassName="font-bespoke-serif-medium text-2xl md:text-3xl text-gray-900 leading-normal italic"
                                            >
                                                {extractText(children)}
                                            </ScrollReveal>
                                        </div>
                                    )
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Posts Section with Distinct Background */}
            <section className="w-full bg-gray-50 py-24 border-t border-gray-100">
                <div className="max-w-[1000px] mx-auto px-6">
                    <AnimatedContent distance={20} delay={0.1}>
                        <div className="flex flex-col items-center mb-12">
                            <span className="text-sm font-poppins text-gray-500 uppercase tracking-widest mb-3">Read Next</span>
                            <h2 className="font-bespoke-serif-medium text-4xl text-gray-900 text-center">
                                Related Articles
                            </h2>
                        </div>
                    </AnimatedContent>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-full">
                                <AnimatedContent distance={30} delay={0.1 * i} className="h-full">
                                    <Link href={`/blog/${i}`} className="block h-full transform hover:-translate-y-2 transition-transform duration-300">
                                        <ProblemCardImage
                                            imageSrc={relatedImages[i - 1]}
                                            imageAlt={`Related Article ${i}`}
                                            tag="Insights"
                                            title={`Related Article ${i}`}
                                            description="Explore more insights about digital credentials and security."
                                            variant={i === 1 ? 'glare' : i === 2 ? 'pixelated' : 'marquee'}
                                            className="h-full shadow-md hover:shadow-xl"
                                        />
                                    </Link>
                                </AnimatedContent>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Attribution / Safety Footer */}
            <div className="w-full bg-gray-50 pb-8 text-center">
                <p className="font-rx100 text-xs text-gray-400">
                    Images sourced from Unsplash & Pinterest for demonstration purposes.
                </p>
            </div>

            {/* Footer */}
            <SiteFooterGlassmorphism />

            {/* Scroll to Top Button */}
            <ScrollToTop />
        </div>
    )
}
