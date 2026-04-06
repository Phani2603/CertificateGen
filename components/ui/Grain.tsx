interface GrainProps {
  /** Opacity of the grain overlay. Default: 0.07 */
  opacity?: number;
  /** Base frequency of the noise. Lower = coarser, Higher = finer. Default: 0.65 */
  baseFrequency?: number;
  /** Number of octaves for detail. Default: 4 */
  numOctaves?: number;
  /** Tile size in px for the repeated grain pattern. Default: 200 */
  tileSize?: number;
  /** Blend mode for the grain overlay. Default: 'overlay' */
  blendMode?: React.CSSProperties["mixBlendMode"];
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
  opacity = 0.07,
  baseFrequency = 0.65,
  numOctaves = 4,
  tileSize = 200,
  blendMode = "overlay",
  className = "",
}: GrainProps) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: buildGrainSVG(baseFrequency, numOctaves),
        backgroundRepeat: "repeat",
        backgroundSize: `${tileSize}px ${tileSize}px`,
        opacity,
        mixBlendMode: blendMode,
        zIndex: 1,
      }}
    />
  );
}
