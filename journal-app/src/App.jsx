import { useState, useEffect } from 'react'
import SplashScreen from './screens/SplashScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen from './screens/HomeScreen'
import NewEntryScreen from './screens/NewEntryScreen'
import EntryDetailScreen from './screens/EntryDetailScreen'
import CalendarScreen from './screens/CalendarScreen'
import MoodScreen from './screens/MoodScreen'
import SearchScreen from './screens/SearchScreen'
import SettingsScreen from './screens/SettingsScreen'

const TRANSITION_DURATION = 280

export default function App() {
  const [screen, setScreen] = useState('splash')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const [prevScreen, setPrevScreen] = useState(null)

  useEffect(() => {
    if (screen === 'splash') {
      const t = setTimeout(() => navigate('onboarding'), 3200)
      return () => clearTimeout(t)
    }
  }, [screen])

  const navigate = (to, data = null) => {
    if (transitioning || to === screen) return
    setTransitioning(true)
    setPrevScreen(screen)
    setTimeout(() => {
      setScreen(to)
      if (data) setSelectedEntry(data)
      setTransitioning(false)
    }, TRANSITION_DURATION)
  }

  const props = { navigate, selectedEntry }

  return (
    <div style={wrapperStyle}>
      {/* Phone frame shadow decoration */}
      <div style={phoneDecor1} />
      <div style={phoneDecor2} />

      {/* Phone shell */}
      <div style={phoneShell}>
        {/* Notch */}
        <div style={notch}>
          <div style={notchPill} />
        </div>

        {/* Screen container */}
        <div style={screenContainer}>
          <div style={{
            ...screenInner,
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'scale(0.98) translateY(4px)' : 'scale(1) translateY(0)',
            transition: `opacity ${TRANSITION_DURATION}ms ease, transform ${TRANSITION_DURATION}ms ease`,
          }}>
            {screen === 'splash' && <SplashScreen {...props} />}
            {screen === 'onboarding' && <OnboardingScreen {...props} />}
            {screen === 'home' && <HomeScreen {...props} />}
            {screen === 'new_entry' && <NewEntryScreen {...props} />}
            {screen === 'entry_detail' && <EntryDetailScreen {...props} />}
            {screen === 'calendar' && <CalendarScreen {...props} />}
            {screen === 'mood' && <MoodScreen {...props} />}
            {screen === 'search' && <SearchScreen {...props} />}
            {screen === 'settings' && <SettingsScreen {...props} />}
          </div>
        </div>

        {/* Home indicator */}
        <div style={homeIndicator} />
      </div>

      {/* Screen label overlay for demo */}
      <div style={screenLabelStyle}>
        {SCREEN_LABELS[screen]}
      </div>

      <style>{`
        @keyframes orbDrift {
          0%,100% { transform: translate(0,0) scale(1); }
          25% { transform: translate(40px,-60px) scale(1.15); }
          50% { transform: translate(-30px,-30px) scale(0.9); }
          75% { transform: translate(20px,50px) scale(1.1); }
        }
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          25% { transform: translate(-50px,40px) scale(0.85); }
          50% { transform: translate(30px,60px) scale(1.2); }
          75% { transform: translate(-20px,-40px) scale(0.95); }
        }
        @keyframes blob {
          0%,100% { border-radius: 58% 42% 35% 65% / 55% 32% 68% 45%; }
          25% { border-radius: 32% 68% 62% 38% / 48% 58% 42% 52%; }
          50% { border-radius: 48% 52% 30% 70% / 35% 65% 60% 40%; }
          75% { border-radius: 65% 35% 52% 48% / 62% 28% 72% 38%; }
        }
        @keyframes glow {
          0%,100% { box-shadow: 0 0 20px rgba(157,143,255,0.3), 0 0 60px rgba(157,143,255,0.1); }
          50% { box-shadow: 0 0 40px rgba(157,143,255,0.6), 0 0 100px rgba(157,143,255,0.2); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0%,100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes blink {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}

const SCREEN_LABELS = {
  splash: 'Screen 1 — Splash',
  onboarding: 'Screen 2–4 — Onboarding',
  home: 'Screen 5 — Home Feed',
  new_entry: 'Screen 6 — New Entry',
  entry_detail: 'Screen 7 — Entry Detail',
  calendar: 'Screen 8 — Calendar',
  mood: 'Screen 9 — Mood Tracker',
  search: 'Screen 10 — Search',
  settings: 'Screen 10 — Profile & Settings',
}

const wrapperStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(ellipse at 30% 40%, rgba(157,143,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(255,126,179,0.04) 0%, transparent 50%), #02020C',
  padding: '20px',
  position: 'relative',
  flexDirection: 'column',
  gap: 20,
}

const phoneDecor1 = {
  position: 'absolute',
  width: 420,
  height: 420,
  borderRadius: '50%',
  background: 'rgba(157,143,255,0.04)',
  filter: 'blur(80px)',
  top: '10%',
  left: '30%',
  pointerEvents: 'none',
  animation: 'orbDrift 12s ease-in-out infinite',
}

const phoneDecor2 = {
  position: 'absolute',
  width: 360,
  height: 360,
  borderRadius: '50%',
  background: 'rgba(255,126,179,0.03)',
  filter: 'blur(80px)',
  bottom: '10%',
  right: '30%',
  pointerEvents: 'none',
  animation: 'orbDrift2 15s ease-in-out infinite',
}

const phoneShell = {
  width: 390,
  height: 844,
  background: '#080812',
  borderRadius: 52,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)',
  flexShrink: 0,
}

const notch = {
  position: 'absolute',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 126,
  height: 34,
  background: '#080812',
  borderRadius: '0 0 20px 20px',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const notchPill = {
  width: 80,
  height: 20,
  borderRadius: 10,
  background: '#000',
  border: '1px solid rgba(255,255,255,0.06)',
}

const screenContainer = {
  position: 'absolute',
  inset: 0,
  borderRadius: 52,
  overflow: 'hidden',
}

const screenInner = {
  width: '100%',
  height: '100%',
}

const homeIndicator = {
  position: 'absolute',
  bottom: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 120,
  height: 5,
  borderRadius: 3,
  background: 'rgba(255,255,255,0.2)',
  zIndex: 200,
}

const screenLabelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: 'rgba(200,200,240,0.35)',
  letterSpacing: '0.5px',
  textAlign: 'center',
  fontFamily: 'Inter, sans-serif',
}
