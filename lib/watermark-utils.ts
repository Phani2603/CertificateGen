/**
 * Watermark configuration and rendering utilities for certificates
 * 
 * This module provides a centralized watermark system for all certificate generation.
 * Designed to be scalable for future pricing tier implementations.
 */

export interface WatermarkConfig {
  enabled: boolean
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  opacity: number
  color: string
  padding: number // Distance from edges
  position: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

export const WATERMARK_CONFIG: WatermarkConfig = {
  enabled: true, // Set to false to disable watermarks globally
  text: 'Issued by Certiflo',
  fontSize: 28, // Base font size (will be scaled for high DPI)
  fontFamily: 'Arial',
  fontWeight: 400,
  opacity: 0.7, // 70% opacity as requested
  color: '#808080', // Gray color
  padding: 20, // Pixels from edge
  position: 'bottom-right',
}

let watermarkConfigLoaded = false
let pendingWatermarkFetch: Promise<boolean> | null = null
let loadedScopeKey = 'global'

export function setWatermarkEnabled(enabled: boolean): void {
  WATERMARK_CONFIG.enabled = enabled
  watermarkConfigLoaded = true
}

export function isWatermarkEnabled(): boolean {
  return WATERMARK_CONFIG.enabled
}

/**
 * Fetches watermark configuration from backend and applies it globally.
 * Defaults to enabled if request fails or response is malformed.
 */
export async function loadWatermarkConfig(
  forceRefresh: boolean = false,
  orgSlug?: string
): Promise<boolean> {
  const normalizedOrgSlug = orgSlug?.trim().toLowerCase()
  const scopeKey = normalizedOrgSlug ? `org:${normalizedOrgSlug}` : 'global'

  if (watermarkConfigLoaded && !forceRefresh && loadedScopeKey === scopeKey) {
    return WATERMARK_CONFIG.enabled
  }

  if (pendingWatermarkFetch && !forceRefresh && loadedScopeKey === scopeKey) {
    return pendingWatermarkFetch
  }

  loadedScopeKey = scopeKey

  pendingWatermarkFetch = (async () => {
    try {
      const endpoint = normalizedOrgSlug
        ? `/api/watermark-config?orgSlug=${encodeURIComponent(normalizedOrgSlug)}`
        : '/api/watermark-config'

      const response = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        setWatermarkEnabled(true)
        return true
      }

      const data: { settings?: { watermarkEnabled?: boolean } } = await response.json()
      const enabled = data?.settings?.watermarkEnabled
      setWatermarkEnabled(typeof enabled === 'boolean' ? enabled : true)
      return WATERMARK_CONFIG.enabled
    } catch (error) {
      console.error('[Watermark] Failed to load config, using default enabled:', error)
      setWatermarkEnabled(true)
      return true
    } finally {
      pendingWatermarkFetch = null
    }
  })()

  return pendingWatermarkFetch
}

/**
 * Determines if a watermark should be shown for an organization
 * 
 * Currently returns true for all organizations. When pricing tiers are implemented,
 * this function should check the organization's subscription status.
 * 
 * @param org - Organization object (optional for now)
 * @returns Whether to show watermark
 * 
 * @example Future implementation:
 * ```typescript
 * export function shouldShowWatermark(org?: { subscriptionTier?: string }): boolean {
 *   if (!WATERMARK_CONFIG.enabled) return false
 *   if (!org) return true
 *   return org.subscriptionTier === 'free' || !org.subscriptionTier
 * }
 * ```
 */
export function shouldShowWatermark(org?: any): boolean {
  // TODO: When pricing tiers are implemented, check org.subscriptionTier
  // For now, show watermark on all certificates
  return WATERMARK_CONFIG.enabled
}

/**
 * Renders a watermark on a canvas context
 * 
 * @param ctx - Canvas 2D context
 * @param canvasWidth - Width of the canvas (scaled)
 * @param canvasHeight - Height of the canvas (scaled)
 * @param scale - DPI scale factor (1 for standard, ~4.17 for high quality)
 */
export function renderWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  scale: number = 1
): void {
  if (!WATERMARK_CONFIG.enabled) return

  // Save current canvas state
  ctx.save()

  // Calculate scaled values
  const scaledFontSize = WATERMARK_CONFIG.fontSize * scale
  const scaledPadding = WATERMARK_CONFIG.padding * scale

  // Set font and text properties
  const fontString = `${WATERMARK_CONFIG.fontWeight} ${scaledFontSize}px ${WATERMARK_CONFIG.fontFamily}`
  ctx.font = fontString
  ctx.fillStyle = WATERMARK_CONFIG.color
  ctx.globalAlpha = WATERMARK_CONFIG.opacity

  // Measure text to calculate position
  const metrics = ctx.measureText(WATERMARK_CONFIG.text)
  const textWidth = metrics.width
  const textHeight = scaledFontSize // Approximate height

  // Calculate position based on config
  let x: number
  let y: number

  switch (WATERMARK_CONFIG.position) {
    case 'bottom-right':
      ctx.textAlign = 'right'
      x = canvasWidth - scaledPadding
      y = canvasHeight - scaledPadding
      break
    case 'bottom-left':
      ctx.textAlign = 'left'
      x = scaledPadding
      y = canvasHeight - scaledPadding
      break
    case 'bottom-center':
      ctx.textAlign = 'center'
      x = canvasWidth / 2
      y = canvasHeight - scaledPadding
      break
    default:
      ctx.textAlign = 'right'
      x = canvasWidth - scaledPadding
      y = canvasHeight - scaledPadding
  }

  // Set text baseline to bottom for consistent positioning
  ctx.textBaseline = 'bottom'

  // Render the watermark
  ctx.fillText(WATERMARK_CONFIG.text, x, y)

  // Restore canvas state
  ctx.restore()
}
