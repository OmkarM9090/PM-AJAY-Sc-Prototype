/** Inline Ashoka Chakra mark (SVG, no external asset needed). */

export default function AshokaChakra({ className = 'h-10 w-10', spokes = 24 }) {
  const lines = Array.from({ length: spokes }, (_, i) => {
    const angle = (i * 360) / spokes
    return (
      <line
        key={i}
        x1="50"
        y1="50"
        x2="50"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.6"
        transform={`rotate(${angle} 50 50)`}
      />
    )
  })
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Ashoka Chakra">
      <circle cx="50" cy="50" r="48" fill="#fff" />
      <g className="text-govblue">
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3.5" />
        {lines}
        <circle cx="50" cy="50" r="7" fill="currentColor" />
      </g>
    </svg>
  )
}
