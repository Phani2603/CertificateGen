'use client'

import { motion } from 'motion/react'

export default function ArticleIntro() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-[720px] mx-auto text-left space-y-8"
        >
            {/* Heading */}
            <h2 className="font-bespoke-serif-medium text-4xl md:text-5xl text-gray-900">
                Welcome to the Certiflo Blog
            </h2>

            {/* Short Intro Paragraph */}
            <p className="font-rx100 text-xl md:text-2xl text-gray-700 leading-[1.6]">
                Discover the latest insights, news, and best practices in digital credential management.
                Our team of experts shares valuable knowledge to help you make the most of certificate
                generation and verification technology.
            </p>

            {/* Long Explanatory Paragraph */}
            <p className="font-rx100 text-xl md:text-2xl text-gray-700 leading-[1.6]">
                In today's digital-first world, the way we issue, manage, and verify credentials has
                fundamentally changed. Traditional paper certificates are being replaced by secure,
                verifiable digital credentials that can be instantly shared and authenticated. This
                transformation is not just about convenience—it's about creating a more trustworthy,
                efficient, and accessible system for recognizing achievements and qualifications.
            </p>

            {/* Methodology Overview */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
                <h3 className="font-poppins text-2xl font-semibold text-gray-900 mb-4">
                    Our Approach
                </h3>
                <p className="font-rx100 text-xl text-gray-700 leading-[1.6]">
                    We combine industry research, real-world case studies, and technical expertise to
                    bring you actionable insights. Each article is carefully crafted to provide practical
                    value, whether you're just getting started with digital certificates or looking to
                    optimize your existing processes.
                </p>
            </div>
        </motion.div>
    )
}
