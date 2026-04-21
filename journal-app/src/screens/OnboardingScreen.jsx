import { useState, useEffect } from 'react'

const slides = [
  {
    id: 0,
    gradient: 'radial-gradient(ellipse at 40% 30%, #160D3A 0%, #06060F 65%)',
    accentColor: '#9D8FFF',
    headline: 'Capture every\nmoment',
    sub: 'Your thoughts deserve a beautiful home. Write freely, think deeply.',
    visual: <NotebookVisual />,
  },
  {
    id: 1,
    gradient: 'radial-gradient(ellipse at 60% 30%, #2A120A 0%, #06060F 65%)',
    accentColor: '#FFB563',
    headline: 'Track your\nemotions',
    sub: 'Understand your patterns. See how you grow across days, weeks, months.',
    visual: <MoodVisual />,
  },
  {
    id: 2,
    gradient: 'radial-gradient(ellipse at 50% 30%, #0A1F1A 0%, #06060F 65%)',
    accentColor: '#5EFFD1',
    headline: 'Build your\nstreak',
    sub: 'Small daily reflections create lasting transformation. Start today.',
    visual: <StreakVisual />,
  },
]

function NotebookVisual() {
  const lines = [1, 2, 3, 4, 5]
  return (
    <div style={{ position: 'relative', width: 240, height: 200 }}>
      {/* Pages floating behind */}
      {[0, 1].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 160,
          height: 200,
          borderRadius: 16,
          background: `rgba(255,255,255,${0.03 + i * 0.02})`,
          border: '1px solid rgba(255,255,255,0.07)',
          top: 8 + i * 8,
          left: 40 - i * 8,
          transform: `rotate(${-3 + i * 3}deg)`,
          animation: `float ${5 + i}s ${i * 2}s ease-in-out infinite`,
        }} />
      ))}
      {/* Main page */}
      <div style={{
        position: 'absolute',
        width: 160,
        height: 200,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(157,143,255,0.25)',
        top: 0,
        left: 40,
        backdropFilter: 'blur(20px)',
        padding: 20,
        animation: 'float 6s ease-in-out infinite',
        boxShadow: '0 20px 60px rgba(157,143,255,0.15)',
      }}>
        {lines.map((_, i) => (
          <div key={i} style={{
            height: 2,
            borderRadius: 2,
            background: `linear-gradient(90deg, rgba(157,143,255,${0.6 - i * 0.08}), transparent)`,
            marginBottom: 14,
            width: i === 4 ? '60%' : '100%',
            animation: `shimmer 2s ${i * 0.3}s ease-in-out infinite`,
          }} />
        ))}
        {/* Pen cursor */}
        <div style={{
          position: 'absolute',
          bottom: 28,
          right: 24,
          animation: 'blink 1.2s ease-in-out infinite',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="2" fill="rgba(157,143,255,0.3)" />
            <rect x="5" y="5" width="2" height="6" fill="rgba(157,143,255,0.8)" />
          </svg>
        </div>
      </div>
      {/* Sparkles */}
      {[0,1,2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          fontSize: 16,
          top: [20, 100, 140][i],
          left: [10, 200, 180][i],
          animation: `starTwinkle ${1.5 + i * 0.7}s ${i * 0.4}s ease-in-out infinite`,
        }}>✦</div>
      ))}
    </div>
  )
}

const FLOATING_MOODS = ['😌', '✨', '💙', '😊', '🥲', '💜', '⚡', '🌙', '💛']

function MoodVisual() {
  const [active, setActive] = useState(2)
  const [floaters, setFloaters] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      const emoji = FLOATING_MOODS[Math.floor(Math.random() * FLOATING_MOODS.length)]
      const id = Date.now()
      setFloaters(f => [...f.slice(-4), { id, emoji, x: 60 + Math.random() * 120 }])
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const moodItems = [
    { e: '😔', c: '#5EC5FF', label: 'Low' },
    { e: '😕', c: '#9D8FFF', label: 'Meh' },
    { e: '😌', c: '#FFB563', label: 'Okay' },
    { e: '😊', c: '#5EFFD1', label: 'Good' },
    { e: '🤩', c: '#FF7EB3', label: 'Great' },
  ]

  return (
    <div style={{ position: 'relative', width: 240, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Floating emoji */}
      {floaters.map(f => (
        <div key={f.id} style={{
          position: 'absolute',
          bottom: 0,
          left: f.x,
          fontSize: 22,
          animation: 'moodFloat 3s ease-out forwards',
          pointerEvents: 'none',
        }}>{f.emoji}</div>
      ))}

      {/* Mood bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', zIndex: 10 }}>
        {moodItems.map((m, i) => (
          <div key={i} onClick={() => setActive(i)} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: active === i ? m.c + '30' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${active === i ? m.c : 'rgba(255,255,255,0.08)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transform: active === i ? 'scale(1.25)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: active === i ? `0 0 20px ${m.c}50` : 'none',
            }}>{m.e}</div>
            <span style={{
              fontSize: 9,
              color: active === i ? m.c : 'rgba(255,255,255,0.3)',
              fontWeight: 600,
              transition: 'color 0.3s',
            }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Glow orb behind */}
      <div style={{
        position: 'absolute',
        width: 160,
        height: 80,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${moodItems[active].c}25 0%, transparent 70%)`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -30%)',
        transition: 'background 0.5s',
        filter: 'blur(20px)',
      }} />

      <style>{`
        @keyframes moodFloat {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-180px) scale(0.4) rotate(20deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function StreakVisual() {
  const weeks = 4
  const days = 7
  const entryDays = new Set([2, 3, 4, 7, 8, 9, 10, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Streak badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(255,181,99,0.12)',
        border: '1px solid rgba(255,181,99,0.3)',
        borderRadius: 20,
        padding: '8px 18px',
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 22 }}>🔥</span>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFB563', lineHeight: 1 }}>12</div>
          <div style={{ fontSize: 10, color: 'rgba(255,181,99,0.7)', fontWeight: 500 }}>day streak</div>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Day labels */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ width: 26, textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        {Array.from({ length: weeks }, (_, w) =>
          <div key={w} style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: days }, (_, d) => {
              const idx = w * 7 + d + 1
              const hasEntry = entryDays.has(idx)
              const isToday = idx === 22
              const isPast = idx <= 22
              return (
                <div key={d} style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: hasEntry
                    ? `linear-gradient(135deg, #5EFFD180, #5EC5FF80)`
                    : isPast ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: isToday ? '1.5px solid #5EFFD1' : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: hasEntry ? `calendarPop 0.4s ${idx * 0.03}s both` : 'none',
                  boxShadow: hasEntry ? '0 0 10px rgba(94,255,209,0.2)' : 'none',
                }}>
                  {hasEntry && (
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <path d="M2 5 L4.5 7.5 L8 3" stroke="#5EFFD1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                        strokeDasharray="50" strokeDashoffset="0" />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes calendarPop {
          from { transform: scale(0) rotate(-8deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function OnboardingScreen({ navigate }) {
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)

  const goNext = () => {
    if (animating) return
    if (step < 2) {
      setAnimating(true)
      setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 350)
    } else {
      navigate('home')
    }
  }

  const slide = slides[step]

  return (
    <div style={{ ...styles.screen, background: slide.gradient }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${slide.accentColor}18 0%, transparent 70%)`,
        top: '5%',
        left: '50%',
        transform: 'translateX(-50%)',
        filter: 'blur(40px)',
        transition: 'background 0.8s ease',
        animation: 'orbDrift 8s ease-in-out infinite',
      }} />

      {/* Visual area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        opacity: animating ? 0 : 1,
        transform: animating ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.35s ease',
      }}>
        {slide.visual}
      </div>

      {/* Text content */}
      <div style={{
        padding: '0 32px 40px',
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(16px)' : 'translateY(0)',
        transition: 'all 0.35s ease',
      }}>
        <h1 style={{
          fontSize: 36,
          fontWeight: 800,
          fontFamily: 'Playfair Display, serif',
          color: '#F0F0FF',
          lineHeight: 1.15,
          marginBottom: 14,
          whiteSpace: 'pre-line',
        }}>{slide.headline}</h1>
        <p style={{
          fontSize: 15,
          color: 'rgba(200,200,230,0.6)',
          lineHeight: 1.6,
          fontWeight: 400,
          marginBottom: 36,
        }}>{slide.sub}</p>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              height: 4,
              borderRadius: 4,
              background: i === step ? slide.accentColor : 'rgba(255,255,255,0.15)',
              width: i === step ? 24 : 8,
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* CTA Button */}
        <button onClick={goNext} style={{
          width: '100%',
          height: 58,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${slide.accentColor}, ${['#FF7EB3','#FF6B8A','#5EC5FF'][step]})`,
          border: 'none',
          color: '#fff',
          fontSize: 17,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: `0 12px 36px ${slide.accentColor}40`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          fontFamily: 'Inter, sans-serif',
        }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {step < 2 ? 'Continue' : 'Start journaling'}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 9 H13 M10 5 L14 9 L10 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {step < 2 && (
          <button onClick={() => navigate('home')} style={{
            width: '100%',
            marginTop: 14,
            background: 'none',
            border: 'none',
            color: 'rgba(200,200,230,0.35)',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}>
            Skip
          </button>
        )}
      </div>

      <style>{`
        @keyframes orbDrift {
          0%,100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.15) translateY(-20px); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(var(--r,0deg)); }
          50% { transform: translateY(-18px) rotate(var(--r,0deg)); }
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; }
        }
        @keyframes blink {
          0%,49% { opacity: 1; } 50%,100% { opacity: 0; }
        }
        @keyframes starTwinkle {
          0%,100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  screen: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    transition: 'background 0.8s ease',
  },
}
