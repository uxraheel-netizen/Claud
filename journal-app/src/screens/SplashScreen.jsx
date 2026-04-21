import { useEffect, useState } from 'react'

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 390,
  delay: Math.random() * 4,
  duration: 6 + Math.random() * 5,
  size: 2 + Math.random() * 4,
  opacity: 0.2 + Math.random() * 0.5,
}))

export default function SplashScreen() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1100)
    const t3 = setTimeout(() => setPhase(3), 1900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div style={styles.screen}>
      {/* Animated background orbs */}
      <div style={{ ...styles.orb, ...styles.orb1 }} />
      <div style={{ ...styles.orb, ...styles.orb2 }} />
      <div style={{ ...styles.orb, ...styles.orb3 }} />

      {/* Stars */}
      {[...Array(30)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 1.5 + Math.random() * 2 + 'px',
          height: 1.5 + Math.random() * 2 + 'px',
          borderRadius: '50%',
          background: '#fff',
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          opacity: 0.15 + Math.random() * 0.4,
          animation: `starTwinkle ${1.5 + Math.random() * 3}s ${Math.random() * 3}s ease-in-out infinite`,
        }} />
      ))}

      {/* Particles */}
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          bottom: -10,
          left: p.x,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: `hsl(${240 + Math.random() * 80}deg, 80%, 75%)`,
          opacity: p.opacity,
          animation: `particleRise ${p.duration}s ${p.delay}s linear infinite`,
        }} />
      ))}

      {/* Center content */}
      <div style={styles.center}>
        {/* Logo icon */}
        <div style={{
          ...styles.logoRing,
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <div style={styles.logoInner}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 10 Q8 6 12 6 L28 6 Q32 6 32 10 L32 30 Q32 34 28 34 L12 34 Q8 34 8 30 Z"
                fill="none" stroke="white" strokeWidth="2" opacity="0.9" />
              <path d="M13 14 L27 14" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <path d="M13 19 L27 19" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <path d="M13 24 L21 24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <circle cx="30" cy="30" r="7" fill="url(#sparkGrad)" />
              <path d="M30 26 L30 34 M26 30 L34 30" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#9D8FFF" />
                  <stop offset="100%" stopColor="#FF7EB3" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* App name */}
        <div style={{
          ...styles.appName,
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s ease',
        }}>
          Lumina
        </div>

        {/* Tagline */}
        <div style={{
          ...styles.tagline,
          opacity: phase >= 3 ? 1 : 0,
          transform: phase >= 3 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.6s ease 0.1s',
        }}>
          your inner world, beautifully kept
        </div>
      </div>

      {/* Loading bar */}
      <div style={styles.loadingTrack}>
        <div style={{
          height: '100%',
          borderRadius: 4,
          background: 'linear-gradient(90deg, #9D8FFF, #FF7EB3)',
          animation: 'loadProgress 2.8s 0.4s ease-in-out forwards',
          width: '0%',
        }} />
      </div>

      <style>{`
        @keyframes loadProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes particleRise {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-900px) scale(0.1); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  screen: {
    width: '100%',
    height: '100%',
    background: 'radial-gradient(ellipse at 50% 40%, #0E0A2A 0%, #06060F 70%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    animation: 'orbDrift 8s ease-in-out infinite, blob 12s ease-in-out infinite',
  },
  orb1: {
    width: 280,
    height: 280,
    background: 'rgba(157,143,255,0.18)',
    top: '10%',
    left: '-10%',
    animationDelay: '0s, 0s',
  },
  orb2: {
    width: 240,
    height: 240,
    background: 'rgba(255,126,179,0.14)',
    top: '30%',
    right: '-15%',
    animationDelay: '3s, 4s',
    animation: 'orbDrift2 10s ease-in-out infinite, blob 15s ease-in-out infinite',
  },
  orb3: {
    width: 200,
    height: 200,
    background: 'rgba(94,194,255,0.1)',
    bottom: '10%',
    left: '20%',
    animationDelay: '6s, 8s',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 32,
    background: 'linear-gradient(135deg, rgba(157,143,255,0.3), rgba(255,126,179,0.3))',
    border: '1px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 60px rgba(157,143,255,0.3), 0 0 120px rgba(157,143,255,0.1)',
    animation: 'glow 3s ease-in-out infinite',
    backdropFilter: 'blur(20px)',
  },
  logoInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pulse 3s ease-in-out infinite',
  },
  appName: {
    fontSize: 42,
    fontWeight: 800,
    fontFamily: 'Playfair Display, serif',
    background: 'linear-gradient(135deg, #C4BAFF 0%, #FF7EB3 60%, #FFB563 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-1px',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(200,200,230,0.5)',
    fontWeight: 400,
    letterSpacing: '0.5px',
    fontStyle: 'italic',
  },
  loadingTrack: {
    position: 'absolute',
    bottom: 60,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 140,
    height: 3,
    borderRadius: 4,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    zIndex: 10,
  },
}
