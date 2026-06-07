/**
 * Cyber grid hero background — vertical glow lines + perspective floor grid.
 */
export default function GridBackground() {
  const lines = [
    { left: '4%', width: '2px', opacity: 0.35, blur: '2px' },
    { left: '11%', width: '1px', opacity: 0.55, blur: '1px' },
    { left: '18%', width: '3px', opacity: 0.25, blur: '4px' },
    { left: '26%', width: '1px', opacity: 0.7, blur: '0px' },
    { left: '33%', width: '2px', opacity: 0.4, blur: '3px' },
    { left: '41%', width: '1px', opacity: 0.5, blur: '1px' },
    { left: '48%', width: '4px', opacity: 0.2, blur: '6px' },
    { left: '52%', width: '1px', opacity: 0.65, blur: '1px' },
    { left: '59%', width: '2px', opacity: 0.35, blur: '2px' },
    { left: '67%', width: '1px', opacity: 0.55, blur: '0px' },
    { left: '74%', width: '3px', opacity: 0.28, blur: '5px' },
    { left: '81%', width: '1px', opacity: 0.6, blur: '1px' },
    { left: '88%', width: '2px', opacity: 0.4, blur: '3px' },
    { left: '95%', width: '1px', opacity: 0.45, blur: '2px' },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black" aria-hidden="true">
      {/* Ambient cyan wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,251,255,0.08)_0%,_transparent_65%)]" />

      {/* Vertical glow lines */}
      {lines.map((line, index) => (
        <div
          key={index}
          className="absolute bottom-0 top-0 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
          style={{
            left: line.left,
            width: line.width,
            opacity: line.opacity,
            filter: `blur(${line.blur})`,
          }}
        />
      ))}

      {/* Soft wide streaks */}
      <div className="absolute left-[20%] top-0 h-full w-24 -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent blur-3xl" />
      <div className="absolute left-[55%] top-0 h-full w-32 -translate-x-1/2 bg-gradient-to-b from-transparent via-teal-400/15 to-transparent blur-3xl" />
      <div className="absolute left-[78%] top-0 h-full w-20 -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent blur-2xl" />

      {/* Perspective floor grid */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] overflow-hidden">
        <div
          className="absolute inset-x-[-50%] bottom-[-20%] h-[140%] origin-bottom"
          style={{
            transform: 'perspective(520px) rotateX(72deg)',
            backgroundImage: `
              linear-gradient(to right, rgba(0, 251, 255, 0.35) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 251, 255, 0.35) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to top, black 20%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 85%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Top vignette */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
    </div>
  )
}
