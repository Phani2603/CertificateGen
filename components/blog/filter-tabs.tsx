'use client'

import { motion } from 'motion/react'

interface FilterTabsProps {
    activeFilter: string
    setActiveFilter: (filter: string) => void
}

const tabs = ['All', 'Insights', 'News', 'Best practices']

export default function FilterTabs({ activeFilter, setActiveFilter }: FilterTabsProps) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            {tabs.map((tab) => {
                const isActive = activeFilter === tab

                return (
                    <motion.button
                        key={tab}
                        onClick={() => setActiveFilter(tab)}
                        className={`
              px-6 py-2.5 rounded-full font-poppins text-sm font-medium
              transition-all duration-300 ease-in-out
              ${isActive
                                ? 'bg-black text-white shadow-md'
                                : 'bg-transparent text-gray-700 border border-gray-300 hover:border-gray-400'
                            }
            `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {tab}
                    </motion.button>
                )
            })}
        </div>
    )
}
