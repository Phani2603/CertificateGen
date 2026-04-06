import type { CSSProperties } from "react";

interface GrainProps {
  /** Grain intensity. Alias for opacity. Default: 0.07 */
  intensity?: number;
  /** Opacity of the grain overlay. Default: 0.07 */
  opacity?: number;
  /** Grain coarseness. Alias for baseFrequency. Lower values look coarser. */
  coarseness?: number;
  /** Base frequency of the noise. Lower = coarser, Higher = finer. Default: 0.65 */
  baseFrequency?: number;
  /** Number of octaves for detail. Default: 4 */
  numOctaves?: number;
  /** Tile size in px for the repeated grain pattern. Default: 200 */
  tileSize?: number;
  /** Blend mode for the grain overlay. Default: 'overlay' */
  blendMode?: CSSProperties["mixBlendMode"];
  /** Additional class names */
  className?: string;
}

const buildGrainSVG = (baseFrequency: number, numOctaves: number): string => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

/**
 * Grain — a zero-dependency noise texture overlay.
 *
 * Usage:
 *   Wrap any element with `position: relative` (or `relative` in Tailwind),
 *   then drop <Grain /> inside as a sibling to your content.
 *
 * @example
 * <div className="relative">
 *   <Grain opacity={0.07} baseFrequency={0.65} />
 *   <h1>Your content</h1>
 * </div>
 */
export default function Grain({
  intensity,
  opacity = 0.07,
  coarseness,
  baseFrequency = 0.65,
  numOctaves = 4,
  tileSize = 200,
  blendMode = "overlay",
  className = "",
}: GrainProps) {
  const resolvedOpacity = intensity ?? opacity;
  const resolvedBaseFrequency = coarseness ?? baseFrequency;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: buildGrainSVG(resolvedBaseFrequency, numOctaves),
        backgroundRepeat: "repeat",
        backgroundSize: `${tileSize}px ${tileSize}px`,
        opacity: resolvedOpacity,
        mixBlendMode: blendMode,
        zIndex: 1,
      }}
    />
  );
}
