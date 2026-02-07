"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import clsx from "clsx"
import { X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

// Context
interface ExpandableScreenContextValue {
  isExpanded: boolean
  expand: () => void
  collapse: () => void
  layoutId: string
  triggerRadius: string
  contentRadius: string
  animationDuration: number
}

const ExpandableScreenContext =
  createContext<ExpandableScreenContextValue | null>(null)

function useExpandableScreen() {
  const context = useContext(ExpandableScreenContext)
  if (!context) {
    throw new Error(
      "useExpandableScreen must be used within an ExpandableScreen"
    )
  }
  return context
}

// Root Component
interface ExpandableScreenProps {
  children: ReactNode
  defaultExpanded?: boolean
  onExpandChange?: (expanded: boolean) => void
  layoutId?: string
  triggerRadius?: string
  contentRadius?: string
  animationDuration?: number
  lockScroll?: boolean
}

export function ExpandableScreen({
  children,
  defaultExpanded = false,
  onExpandChange,
  layoutId = "expandable-card",
  triggerRadius = "100px",
  contentRadius = "24px",
  animationDuration = 0.3,
  lockScroll = true,
}: ExpandableScreenProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const expand = () => {
    setIsExpanded(true)
    onExpandChange?.(true)
  }

  const collapse = () => {
    setIsExpanded(false)
    onExpandChange?.(false)
  }

  useEffect(() => {
    if (lockScroll && isExpanded) {
      // Save current scroll position and lock body
      const scrollY = window.scrollY
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
      document.body.style.paddingRight = `${scrollbarWidth}px`
      
      return () => {
        // Restore body scroll
        const scrollY = document.body.style.top
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        document.body.style.paddingRight = ""
        window.scrollTo(0, parseInt(scrollY || "0") * -1)
      }
    }
  }, [isExpanded, lockScroll])

  return (
    <ExpandableScreenContext.Provider
      value={{
        isExpanded,
        expand,
        collapse,
        layoutId,
        triggerRadius,
        contentRadius,
        animationDuration,
      }}
    >
      {children}
    </ExpandableScreenContext.Provider>
  )
}

// Trigger Component
interface ExpandableScreenTriggerProps {
  children: ReactNode
  className?: string
}

export function ExpandableScreenTrigger({
  children,
  className = "",
}: ExpandableScreenTriggerProps) {
  const { isExpanded, expand, layoutId, triggerRadius } = useExpandableScreen()

  return (
    <AnimatePresence initial={false}>
      {!isExpanded && (
        <motion.div className={`inline-block relative ${className}`}>
          {/* Background layer with shared layoutId for morphing */}
          <motion.div
            style={{
              borderRadius: triggerRadius,
            }}
            layout
            layoutId={layoutId}
            className="absolute inset-0 transform-gpu will-change-transform"
          />
          {/* Content layer that fades out on expand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            layout={false}
            onClick={expand}
            className="relative cursor-pointer"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Content Component
interface ExpandableScreenContentProps {
  children: ReactNode
  className?: string
  showCloseButton?: boolean
  closeButtonClassName?: string
  overlayClassName?: string
}

export function ExpandableScreenContent({
  children,
  className = "",
  showCloseButton = true,
  closeButtonClassName = "",
  overlayClassName = "",
}: ExpandableScreenContentProps) {
  const { isExpanded, collapse, layoutId, contentRadius, animationDuration } =
    useExpandableScreen()

  const panelTransition = {
    type: "spring" as const,
    stiffness: 220,
    damping: 24,
    mass: 0.9,
  }

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        animationDuration === 0 ? (
          <div
            className={clsx(
              "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-2",
              overlayClassName
            )}
            onClick={(e) => {
              if (e.target === e.currentTarget) collapse()
            }}
            onWheel={(e) => e.currentTarget === e.target && e.preventDefault()}
            onTouchMove={(e) => e.currentTarget === e.target && e.preventDefault()}
          >
            <div
              className={`relative flex h-full w-full max-h-[90vh] overflow-hidden ${className}`}
              style={{ borderRadius: contentRadius }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative z-20 w-full h-full overflow-y-auto overscroll-contain">{children}</div>
              {showCloseButton && (
                <button
                  onClick={collapse}
                  className={`absolute right-6 top-6 z-30 flex h-10 w-10 items-center justify-center transition-colors rounded-full ${
                    closeButtonClassName || "text-white bg-transparent hover:bg-white/10"
                  }`}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={clsx(
            "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-2",
            overlayClassName
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) collapse()
          }}
          onWheel={(e) => e.currentTarget === e.target && e.preventDefault()}
          onTouchMove={(e) => e.currentTarget === e.target && e.preventDefault()}
        >
          {/* Morphing background with shared layoutId */}
          <motion.div
            layoutId={layoutId}
            initial={{ opacity: 0.9, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0.9, scale: 0.97, y: 10 }}
            transition={{
              ...panelTransition,
              duration: animationDuration,
            }}
            style={{
              borderRadius: contentRadius,
            }}
            layout
            className={`relative flex h-full w-full max-h-[90vh] overflow-hidden transform-gpu will-change-transform ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ ...panelTransition, duration: 0.24 }}
              className="relative z-20 w-full h-full overflow-y-auto overscroll-contain"
            >
              {children}
            </motion.div>

            {showCloseButton && (
              <motion.button
                onClick={collapse}
                className={`absolute right-6 top-6 z-30 flex h-10 w-10 items-center justify-center transition-colors rounded-full ${
                  closeButtonClassName ||
                  "text-white bg-transparent hover:bg-white/10"
                }`}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
        )
      )}
    </AnimatePresence>
  )
}

// Background Component (optional)
interface ExpandableScreenBackgroundProps {
  trigger?: ReactNode
  content?: ReactNode
  className?: string
}

export function ExpandableScreenBackground({
  trigger,
  content,
  className = "",
}: ExpandableScreenBackgroundProps) {
  const { isExpanded } = useExpandableScreen()

  if (isExpanded && content) {
    return <div className={className}>{content}</div>
  }

  if (!isExpanded && trigger) {
    return <div className={className}>{trigger}</div>
  }

  return null
}

export { useExpandableScreen }
