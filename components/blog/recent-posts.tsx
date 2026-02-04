'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import ProblemCardImage from '@/components/problem-card-image'

interface BlogPost {
    id: number
    title: string
    excerpt: string
    date: string
    author: string
    tags: string[]
    image: string
    category: string
}

interface RecentPostsProps {
    posts: BlogPost[]
}

// Curated Unsplash images for blog posts (16:9 aspect ratio, high quality)
const unsplashImages = [
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=450&fit=crop', // Blockchain/tech
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop', // Design/certificates
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop', // API/coding
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=450&fit=crop', // University/education
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop', // Security/lock
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop', // Celebration/milestone
]

const variants = ['glare', 'pixelated', 'marquee'] as const

export default function RecentPosts({ posts }: RecentPostsProps) {
    return (
        <div className="space-y-12">
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <Link href={`/blog/${post.id}`}>
                            <ProblemCardImage
                                imageSrc={unsplashImages[index % unsplashImages.length]}
                                imageAlt={post.title}
                                tag={post.tags[0]}
                                title={post.title}
                                description={post.excerpt}
                                variant={variants[index % variants.length]}
                            />
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Staggered Animation Trigger */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
            />
        </div>
    )
}
