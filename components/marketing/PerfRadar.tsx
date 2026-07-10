// components/marketing/PerfRadar.tsx — radar de desempeño (SVG)
const SUBJECTS = [
  { label: 'Matemáticas', value: 0.82 },
  { label: 'Español', value: 0.74 },
  { label: 'Física', value: 0.68 },
  { label: 'Química', value: 0.6 },
  { label: 'Biología', value: 0.78 },
  { label: 'Comp. lectora', value: 0.88 },
]

const SIZE = 320
const C = SIZE / 2
const R = 120

function point(i: number, r: number) {
  const angle = (Math.PI * 2 * i) / SUBJECTS.length - Math.PI / 2
  return [C + r * Math.cos(angle), C + r * Math.sin(angle)]
}

export default function PerfRadar() {
  const dataPoints = SUBJECTS.map((s, i) => point(i, R * s.value))
  const polygon = dataPoints.map((p) => p.join(',')).join(' ')

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[340px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={ring}
          points={SUBJECTS.map((_, i) => point(i, R * ring).join(',')).join(' ')}
          fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {SUBJECTS.map((_, i) => {
        const [x, y] = point(i, R)
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />
      })}
      <polygon points={polygon} fill="rgba(37,99,235,0.18)" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      {dataPoints.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#2563eb" />)}
      {SUBJECTS.map((s, i) => {
        const [x, y] = point(i, R + 26)
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontWeight="600" fill="#475569">{s.label}</text>
        )
      })}
    </svg>
  )
}
