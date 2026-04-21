import { useState, useEffect } from 'react'
import { moodHistory, weeklyMoods } from '../data/mockData'
import BottomNav from '../components/BottomNav'

const MOOD_COLORS = ['#5EC5FF', '#9D8FFF', '#FFB563', '#5EFFD1', '#FF7EB3']
const MOOD_BG = ['rgba(94,197,255,0.1)', 'rgba(157,143,255,0.1)', 'rgba(255,181,99,0.1)', 'rgba(94,255,209,0.1)', 'rgba(255,126,179,0.1)']

function MoodWave({ data, color, animated }) {
  const w = 346
  const h = 120
  const max = 5

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (d.score / max) * (h - 20) - 10,
  }))

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + p.x) / 2
    return acc + ` C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`
  }, '')

  const areaD = pathD + ` L ${w} ${h} L 0 ${h} Z`

  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} overflow="visible">
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[1,2,3,4,5].map(v => {
          const y = h - (v / max) * (h - 20) - 10
          return (
            <line key={v} x1="0" y1={y} x2={w} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,6" />
          )
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#waveGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"
          style={animated ? {
            strokeDasharray: 1000,
            strokeDashoffset: 0,
            animation: 'drawLine 1.5s ease forwards',
          } : {}}
        />

        {/* Dots at data points (every 5th) */}
        {points.filter((_, i) => i % 4 === 0).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={color}
            style={{ animation: `scaleIn 0.3s ${i * 0.08}s both` }}
            filter="url(#glow)" />
        ))}
      </svg>

      <style>{`
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes scaleIn {
          from { transform-origin: center; transform: scale(0); }
          to { transform-origin: center; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default function MoodScreen({ navigate }) {
  const [period, setPeriod] = useState('week')
  const [visible, setVisible] = useState(false)
  const [activeMood, setActiveMood] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const avg = (weeklyMoods.reduce((s, d) => s + d.score, 0) / weeklyMoods.length).toFixed(1)
  const MOOD_EMOJIS = ['😔', '😕', '😌', '😊', '🤩']
  const avgEmoji = MOOD_EMOJIS[Math.round(avg) - 1]

  return (
    <div style={styles.screen}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 220,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,181,99,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        ...styles.header,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'all 0.4s ease',
      }}>
        <div>
          <div style={styles.screenLabel}>Mood Tracker</div>
          <div style={styles.screenTitle}>Your emotional journey</div>
        </div>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          background: 'rgba(255,181,99,0.12)',
          border: '1px solid rgba(255,181,99,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          animation: 'float 4s ease-in-out infinite',
        }}>
          {avgEmoji}
        </div>
      </div>

      {/* Average mood card */}
      <div style={{
        ...styles.avgCard,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.4s ease 0.1s',
      }}>
        <div style={styles.avgLeft}>
          <div style={styles.avgLabel}>This week's average</div>
          <div style={styles.avgScore}>
            <span style={styles.avgNum}>{avg}</span>
            <span style={styles.avgMax}>/5</span>
          </div>
          <div style={styles.avgEmoji}>
            {MOOD_EMOJIS.map((e, i) => (
              <span key={i} style={{
                fontSize: 20,
                opacity: Math.round(avg) - 1 === i ? 1 : 0.25,
                transform: Math.round(avg) - 1 === i ? 'scale(1.3)' : 'scale(1)',
                display: 'inline-block',
                transition: 'all 0.3s',
                marginRight: 2,
              }}>{e}</span>
            ))}
          </div>
        </div>

        {/* Mini spark bars */}
        <div style={styles.sparkBars}>
          {weeklyMoods.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 6,
                height: 40,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column-reverse',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: `${(d.score / 5) * 100}%`,
                  background: MOOD_COLORS[d.score - 1],
                  borderRadius: 3,
                  animation: `slideUp 0.5s ${i * 0.06}s both`,
                  boxShadow: `0 0 6px ${MOOD_COLORS[d.score - 1]}80`,
                }} />
              </div>
              <span style={{ fontSize: 8, color: 'rgba(160,160,190,0.4)', fontWeight: 600 }}>{d.day.slice(0, 1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Period toggle */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '0 20px 16px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease 0.2s',
      }}>
        {['week', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '8px 18px',
            borderRadius: 12,
            border: period === p ? '1px solid rgba(255,181,99,0.3)' : '1px solid transparent',
            background: period === p ? 'rgba(255,181,99,0.15)' : 'rgba(255,255,255,0.04)',
            color: period === p ? '#FFB563' : 'rgba(180,180,210,0.5)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s ease',
          }}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Wave chart */}
      <div style={{
        padding: '0 20px 16px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease 0.3s',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: '16px 0 8px',
          overflow: 'hidden',
        }}>
          <MoodWave data={moodHistory.slice(-14)} color="#FFB563" animated={visible} />
          {/* X axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 16px 0', opacity: 0.4 }}>
            {moodHistory.slice(-14).filter((_, i) => i % 3 === 0).map(d => (
              <span key={d.date} style={{ fontSize: 9, color: 'rgba(200,200,230,0.6)', fontWeight: 500 }}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Daily mood log */}
      <div style={{
        padding: '0 20px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.4s ease 0.4s',
      }}>
        <div style={styles.sectionTitle}>This week</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
          {weeklyMoods.map((d, i) => (
            <div key={d.day} onClick={() => setActiveMood(activeMood === i ? null : i)} style={{
              ...styles.dayRow,
              background: activeMood === i ? MOOD_BG[d.score - 1] : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeMood === i ? MOOD_COLORS[d.score - 1] + '30' : 'rgba(255,255,255,0.06)'}`,
              animation: `slideUp 0.3s ${i * 0.05}s both`,
            }}>
              <span style={styles.dayName}>{d.day}</span>
              <span style={{ fontSize: 22 }}>{d.emoji}</span>
              <div style={styles.barTrack}>
                <div style={{
                  height: '100%',
                  borderRadius: 4,
                  width: `${(d.score / 5) * 100}%`,
                  background: MOOD_COLORS[d.score - 1],
                  boxShadow: `0 0 10px ${MOOD_COLORS[d.score - 1]}50`,
                  animation: `slideRight 0.5s ${0.4 + i * 0.06}s both`,
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: MOOD_COLORS[d.score - 1], minWidth: 12 }}>{d.score}</span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav current="mood" navigate={navigate} />

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideRight {
          from { width: 0; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  screen: {
    width: '100%',
    height: '100%',
    background: '#06060F',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '52px 24px 16px',
    position: 'relative',
    zIndex: 1,
  },
  screenLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(200,200,230,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#F0F0FF',
    fontFamily: 'Playfair Display, serif',
  },
  avgCard: {
    margin: '0 20px 16px',
    padding: '18px 20px',
    borderRadius: 20,
    background: 'rgba(255,181,99,0.06)',
    border: '1px solid rgba(255,181,99,0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avgLeft: {},
  avgLabel: {
    fontSize: 11,
    color: 'rgba(255,181,99,0.6)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 4,
  },
  avgScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: 8,
  },
  avgNum: {
    fontSize: 38,
    fontWeight: 800,
    color: '#FFB563',
    lineHeight: 1,
  },
  avgMax: {
    fontSize: 14,
    color: 'rgba(255,181,99,0.4)',
    fontWeight: 600,
  },
  avgEmoji: {
    display: 'flex',
    gap: 2,
  },
  sparkBars: {
    display: 'flex',
    gap: 6,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(200,200,240,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 10,
  },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 16,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  dayName: {
    fontSize: 13,
    fontWeight: 700,
    color: 'rgba(200,200,240,0.7)',
    minWidth: 32,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
}
