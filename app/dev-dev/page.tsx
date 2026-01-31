'use client'

import { useState } from 'react'
import ProblemCard from '@/components/problem-card'
import ProblemCardImage from '@/components/problem-card-image'
import { GlareCard } from '@/components/ui/glare-card'
import { PixelatedCanvas } from '@/components/ui/pixelated-canvas'
import WorldMap from '@/components/ui/world-map'
import FloatingLines from '@/components/FloatingLines'
import { motion } from 'motion/react'

export default function DevDevPage() {
    const [sampleText, setSampleText] = useState('The quick brown fox jumps over the lazy dog')

    const fonts = [
        // Serif Fonts
        { name: 'Playfair Display', className: 'font-playfair', category: 'Serif' },
        { name: 'Cormorant Garamond', className: 'font-cormorant', category: 'Serif' },
        { name: 'Lora', className: 'font-lora', category: 'Serif' },
        { name: 'Crimson Text', className: 'font-crimson', category: 'Serif' },
        { name: 'Merriweather', className: 'font-merriweather', category: 'Serif' },

        // Sans-Serif Fonts
        { name: 'Roboto', className: 'font-roboto', category: 'Sans-Serif' },
        { name: 'Montserrat', className: 'font-montserrat', category: 'Sans-Serif' },
        { name: 'Open Sans', className: 'font-open-sans', category: 'Sans-Serif' },
        { name: 'Poppins', className: 'font-poppins', category: 'Sans-Serif' },
        { name: 'Inter', className: 'font-inter', category: 'Sans-Serif' },
        { name: 'Raleway', className: 'font-raleway', category: 'Sans-Serif' },
        { name: 'Iceland', className: 'font-iceland', category: 'Sans-Serif' },
        { name: 'Coda', className: 'font-coda', category: 'Sans-Serif' },

        // Script Fonts
        { name: 'Caveat', className: 'font-caveat', category: 'Script' },
        { name: 'Marck Script', className: 'font-marck-script', category: 'Script' },
        { name: 'Great Vibes', className: 'font-great-vibes', category: 'Script' },
        { name: 'Pacifico', className: 'font-pacifico', category: 'Script' },
        { name: 'Dancing Script', className: 'font-dancing-script', category: 'Script' },
        { name: 'Tangerine', className: 'font-tangerine', category: 'Script' },

        // Custom Local Fonts
        { name: 'Bespoke Serif', className: 'font-bespoke-serif', category: 'Custom' },
        { name: 'Bespoke Serif Light', className: 'font-bespoke-serif-light', category: 'Custom' },
        { name: 'Bespoke Serif Medium', className: 'font-bespoke-serif-medium', category: 'Custom' },
        { name: 'Bespoke Serif Bold', className: 'font-bespoke-serif-bold', category: 'Custom' },
        { name: 'Bespoke Serif Extrabold', className: 'font-bespoke-serif-extrabold', category: 'Custom' },
        { name: 'RX100', className: 'font-rx100', category: 'Custom' },
    ]

    const categories = ['All', 'Serif', 'Sans-Serif', 'Script', 'Custom']
    const [activeCategory, setActiveCategory] = useState('All')

    const filteredFonts = activeCategory === 'All'
        ? fonts
        : fonts.filter(font => font.category === activeCategory)

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-24">

                {/* NEW: Problem Card Showcase Section */}
                <section>
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Problem Cards - Component Based</h2>
                        <p className="text-lg text-gray-500">Reusable cards that accept React components as children</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Card 1 - Glare Effect with GlareCard Component */}
                        <ProblemCard
                            tag="Problem"
                            title="Outdated Digital Presence"
                            description="Outdated website or app turns away potential clients."
                            variant="glare"
                        >
                            <GlareCard className="flex flex-col items-center justify-center w-full h-full">
                                <svg
                                    width="35"
                                    height="35"
                                    viewBox="0 0 66 65"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-14 w-14 text-white"
                                >
                                    <path
                                        d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
                                        stroke="currentColor"
                                        strokeWidth="15"
                                        strokeMiterlimit="3.86874"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <p className="text-white font-bold text-2xl mt-4">Aceternity</p>
                            </GlareCard>
                        </ProblemCard>

                        {/* Card 2 - Pixelated Effect with PixelatedCanvas Component */}
                        <ProblemCard
                            tag="Problem"
                            title="Lack of Technical Expertise"
                            description="Struggling with evolving tech and costly in-house teams."
                            variant="pixelated"
                        >
                            <div className="w-full h-full flex items-center justify-center">
                                <PixelatedCanvas
                                    src="/cflo1.png"
                                    width={276}
                                    height={180}
                                    cellSize={4}
                                    dotScale={0.85}
                                    shape="circle"
                                    backgroundColor="#F5F5F7"
                                    interactive={true}
                                    className="rounded-2xl"
                                />
                            </div>
                        </ProblemCard>

                        {/* Card 3 - FloatingLines Background + WorldMap (No Marquee) */}
                        <ProblemCard
                            tag="Problem"
                            title="Inefficient Processes"
                            description="Manual work and outdated tools slow teams down."
                            variant="glare"
                        >
                            <div className="w-full h-full relative">
                                {/* FloatingLines Background (Three.js WebGL) */}
                                <FloatingLines
                                    enabledWaves={["top", "middle", "bottom"]}
                                    lineCount={[5, 6, 5]}
                                    lineDistance={[5, 5, 5]}
                                    bendRadius={5}
                                    bendStrength={-0.5}
                                    interactive={true}
                                    parallax={true}
                                    linesGradient={["#6366f1", "#8b5cf6", "#d946ef"]}
                                    animationSpeed={0.8}
                                    mouseDamping={0.05}
                                    parallaxStrength={0.15}
                                    mixBlendMode="screen"
                                />

                                {/* WorldMap on top */}
                                <div className="absolute inset-0 flex bg-transparent flex-col items-center justify-center overflow-hidden pointer-events-none">
                                    <div className="text-center mb-4 z-10">
                                        <p className="font-bold text-lg text-white text-yellow-300">
                                            Remote{" "}
                                            <span className="text-neutral-400">
                                                {"Connectivity".split("").map((word, idx) => (
                                                    <motion.span
                                                        key={idx}
                                                        className="inline-block"
                                                        initial={{ x: -10, opacity: 0 }}
                                                        animate={{ x: 0, opacity: 1 }}
                                                        transition={{ duration: 0.5, delay: idx * 0.04 }}
                                                    >
                                                        {word}
                                                    </motion.span>
                                                ))}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="w-full h-full scale-[0.9] bg-transparent origin-center">
                                        <WorldMap
                                            dots={[
                                                {
                                                    start: { lat: 64.2008, lng: -149.4937 },
                                                    end: { lat: 34.0522, lng: -118.2437 },
                                                },
                                                {
                                                    start: { lat: 64.2008, lng: -149.4937 },
                                                    end: { lat: -15.7975, lng: -47.8919 },
                                                },
                                                {
                                                    start: { lat: -15.7975, lng: -47.8919 },
                                                    end: { lat: 38.7223, lng: -9.1393 },
                                                },
                                                {
                                                    start: { lat: 51.5074, lng: -0.1278 },
                                                    end: { lat: 28.6139, lng: 77.209 },
                                                },
                                                {
                                                    start: { lat: 28.6139, lng: 77.209 },
                                                    end: { lat: 43.1332, lng: 131.9113 },
                                                },
                                                {
                                                    start: { lat: 28.6139, lng: 77.209 },
                                                    end: { lat: -1.2921, lng: 36.8219 },
                                                },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ProblemCard>
                    </div>
                </section>

                {/* Image-based Cards Section */}
                <section>
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Problem Cards - Image Based</h2>
                        <p className="text-lg text-gray-500">Traditional cards with image support and visual effects</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Image Card 1 - Glare Effect */}
                        <ProblemCardImage
                            imageSrc="/verifyimg.svg"
                            imageAlt="Outdated Digital Presence"
                            tag="Problem"
                            title="Outdated Digital Presence"
                            description="Outdated website or app turns away potential clients."
                            variant="glare"
                        />

                        {/* Image Card 2 - Pixelated Effect */}
                        <ProblemCardImage
                            imageSrc="/verifyimg.svg"
                            imageAlt="Lack of Technical Expertise"
                            tag="Problem"
                            title="Lack of Technical Expertise"
                            description="Struggling with evolving tech and costly in-house teams."
                            variant="pixelated"
                        />

                        {/* Image Card 3 - Marquee Effect */}
                        <ProblemCardImage
                            imageSrc="/verifyimg.svg"
                            imageAlt="Inefficient Processes"
                            tag="Problem"
                            title="Inefficient Processes"
                            description="Manual work and outdated tools slow teams down."
                            variant="marquee"
                        />
                    </div>
                </section>

                {/* Existing Font Showcase */}
                <section>
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                            Font Showcase
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                            Explore all {fonts.length} fonts available in this project
                        </p>

                        {/* Custom Text Input */}
                        <div className="max-w-2xl mx-auto mb-8">
                            <input
                                type="text"
                                value={sampleText}
                                onChange={(e) => setSampleText(e.target.value)}
                                placeholder="Type your custom text here..."
                                className="w-full px-6 py-4 text-lg border-2 border-slate-300 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex justify-center gap-3 flex-wrap">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`px-6 py-2.5 rounded-full font-medium transition-all ${activeCategory === category
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Grid */}
                    <div className="grid gap-8">
                        {filteredFonts.map((font) => (
                            <div
                                key={font.name}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
                            >
                                {/* Font Header */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                            {font.name}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            <span className="inline-block px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-xs font-medium">
                                                {font.category}
                                            </span>
                                        </p>
                                    </div>
                                    <code className="text-sm bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 font-mono">
                                        {font.className}
                                    </code>
                                </div>

                                {/* Font Samples */}
                                <div className="space-y-6">
                                    {/* Large Display */}
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                                            Display (48px)
                                        </p>
                                        <p className={`${font.className} text-5xl text-slate-900 dark:text-slate-100`}>
                                            {sampleText}
                                        </p>
                                    </div>

                                    {/* Medium */}
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                                            Heading (32px)
                                        </p>
                                        <p className={`${font.className} text-3xl text-slate-900 dark:text-slate-100`}>
                                            {sampleText}
                                        </p>
                                    </div>

                                    {/* Body */}
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                                            Body (16px)
                                        </p>
                                        <p className={`${font.className} text-base text-slate-900 dark:text-slate-100`}>
                                            {sampleText}
                                        </p>
                                    </div>

                                    {/* Weight Variations */}
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider font-semibold">
                                            Weight Variations
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className={`${font.className} font-light text-slate-900 dark:text-slate-100`}>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Light (300)</span>
                                                {sampleText}
                                            </div>
                                            <div className={`${font.className} font-normal text-slate-900 dark:text-slate-100`}>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Regular (400)</span>
                                                {sampleText}
                                            </div>
                                            <div className={`${font.className} font-bold text-slate-900 dark:text-slate-100`}>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Bold (700)</span>
                                                {sampleText}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Alphabet */}
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                                            Character Set
                                        </p>
                                        <p className={`${font.className} text-lg text-slate-700 dark:text-slate-300`}>
                                            ABCDEFGHIJKLMNOPQRSTUVWXYZ
                                        </p>
                                        <p className={`${font.className} text-lg text-slate-700 dark:text-slate-300`}>
                                            abcdefghijklmnopqrstuvwxyz
                                        </p>
                                        <p className={`${font.className} text-lg text-slate-700 dark:text-slate-300`}>
                                            0123456789 !@#$%^&*()
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Stats */}
                    <div className="mt-12 text-center">
                        <div className="inline-flex items-center gap-4 bg-white dark:bg-slate-800 px-8 py-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-violet-600">{filteredFonts.length}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Fonts Displayed</p>
                            </div>
                            <div className="w-px h-12 bg-slate-300 dark:bg-slate-700" />
                            <div className="text-center">
                                <p className="text-3xl font-bold text-indigo-600">{fonts.length}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Total Fonts</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
