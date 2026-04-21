import { useState, useEffect } from 'react'
import { entries } from '../data/mockData'
import BottomNav from '../components/BottomNav'

const QUICK_MOODS = ['😔', '😕', '😌', '😊', '🤩']
const MOOD_COLORS = ['#5EC5FF', '#9D8FFF', '#FFB563', '#5EFFD1', '#FF7EB3']
const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening']

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? GREETINGS[0] : h < 17 ? GREETINGS[1] : GREETINGS[2]
}

const QUOTES = [
  "The unexamined life is not worth living.",
  "Fill your paper with the breathings of your heart.",
  "Write hard and clear about what hurts.",
  "In the journal I do not just express myself — I create myself.",
]

export default function HomeScreen({ navigate }) {
  const [selectedMood, setSelectedMood] = useState(null)
  const [ripple, setRipple] = useState(null)
  const [visible, setVisible] = useState(false)
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleMoodSelect = (i) => {
    setSelectedMood(i)
    setRipple(i)
    setTimeout(() => setRipple(null), 600)
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const today = new Date()
    const diff = Math.floor((today - d) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={styles.screen}>
      {/* Background */}
      <div style={styles.bg} />

      {/* Header */}
      <div style={{
        ...styles.header,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'all 0.5s ease',
      }}>
        <div>
          <div style={styles.greeting}>{getGreeting()}</div>
          <div style={styles.name}>Alex ✨</div>
        </div>
        <div style={styles.avatar}>
          <span style={{ fontSize: 22 }}>🌙</span>
        </div>
      </div>

      {/* Quote card */}
      <div style={{
        ...styles.quoteCard,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s ease 0.1s',
      }}>
        <div style={styles.quoteIcon}>"</div>
        <p style={styles.quoteText}>{quote}</p>
      </div>

      {/* Mood capture */}
      <div style={{
        ...styles.section,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s ease 0.2s',
      }}>
        <div style={styles.sectionTitle}>How are you feeling?</div>
        <div style={styles.moodRow}>
          {QUICK_MOODS.map((emoji, i) => (
            <div key={i} style={{ position: 'relative' }}>
              {ripple === i && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: MOOD_COLORS[i] + '40',
                  animation: 'rippleAnim 0.6s ease forwards',
                  pointerEvents: 'none',
                }} />
              )}
              <button
                onClick={() => handleMoodSelect(i)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  border: `1.5px solid ${selectedMood === i ? MOOD_COLORS[i] : 'rgba(255,255,255,0.08)'}`,
                  background: selectedMood === i ? MOOD_COLORS[i] + '22' : 'rgba(255,255,255,0.04)',
                  fontSize: 24,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: selectedMood === i ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: selectedMood === i ? `0 0 20px ${MOOD_COLORS[i]}50` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >{emoji}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Entries section */}
      <div style={{
        ...styles.section,
        flex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s ease 0.3s',
      }}>
        <div style={styles.sectionRow}>
          <div style={styles.sectionTitle}>Recent entries</div>
          <button onClick={() => navigate('calendar')} style={styles.seeAll}>See all →</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 }}>
          {entries.slice(0, 4).map((entry, i) => (
            <div
              key={entry.id}
              onClick={() => navigate('entry_detail', entry)}
              style={{
                ...styles.card,
                animation: `entryCardIn 0.4s ${i * 0.07}s both`,
              }}
            >
              {/* Color accent bar */}
              <div style={{
                width: 3,
                background: entry.color,
                borderRadius: 3,
                alignSelf: 'stretch',
                minHeight: 60,
                flexShrink: 0,
                boxShadow: `0 0 12px ${entry.color}60`,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.cardTop}>
                  <span style={styles.cardDate}>{formatDate(entry.date)}</span>
                  <span style={{ fontSize: 18 }}>{entry.mood}</span>
                </div>
                <div style={styles.cardTitle}>{entry.title}</div>
                <div style={styles.cardPreview}>{entry.content.slice(0, 72)}...</div>
                <div style={styles.cardMeta}>
                  <div style={styles.tagRow}>
                    {entry.tags.slice(0, 2).map(t => (
                      <span key={t} style={{ ...styles.tag, borderColor: entry.color + '40', color: entry.color }}>#{t}</span>
                    ))}
                  </div>
                  <span style={styles.readTime}>{entry.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => navigate('new_entry')} style={styles.fab}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5 V19 M5 12 H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      <BottomNav current="home" navigate={navigate} />

      <style>{`
        @keyframes entryCardIn {
          from { transform: translateX(-20px) scale(0.97); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes rippleAnim {
          from { transform: scale(0.5); opacity: 1; }
          to { transform: scale(3); opacity: 0; }
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
  bg: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(157,143,255,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '52px 24px 16px',
    position: 'relative',
    zIndex: 1,
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(200,200,240,0.5)',
    fontWeight: 500,
    marginBottom: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: 800,
    color: '#F0F0FF',
    fontFamily: 'Playfair Display, serif',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    background: 'rgba(157,143,255,0.12)',
    border: '1px solid rgba(157,143,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteCard: {
    margin: '0 20px 16px',
    padding: '16px 18px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    position: 'relative',
    zIndex: 1,
  },
  quoteIcon: {
    fontSize: 28,
    lineHeight: 1,
    background: 'linear-gradient(135deg, #9D8FFF, #FF7EB3)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: 4,
    fontFamily: 'Georgia, serif',
  },
  quoteText: {
    fontSize: 13,
    color: 'rgba(200,200,240,0.6)',
    lineHeight: 1.55,
    fontStyle: 'italic',
    fontWeight: 400,
  },
  section: {
    padding: '0 20px 16px',
    position: 'relative',
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(200,200,240,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 12,
  },
  sectionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 12,
    color: '#9D8FFF',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  moodRow: {
    display: 'flex',
    gap: 8,
  },
  card: {
    display: 'flex',
    gap: 14,
    padding: '16px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    backdropFilter: 'blur(10px)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 11,
    color: 'rgba(160,160,190,0.6)',
    fontWeight: 500,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#E8E8FF',
    marginBottom: 5,
    lineHeight: 1.3,
  },
  cardPreview: {
    fontSize: 13,
    color: 'rgba(160,160,190,0.55)',
    lineHeight: 1.5,
    marginBottom: 10,
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagRow: {
    display: 'flex',
    gap: 6,
  },
  tag: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 8,
    border: '1px solid',
    background: 'transparent',
  },
  readTime: {
    fontSize: 10,
    color: 'rgba(140,140,170,0.5)',
    fontWeight: 500,
  },
  fab: {
    position: 'fixed',
    bottom: 96,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 20,
    background: 'linear-gradient(135deg, #9D8FFF, #FF7EB3)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 30px rgba(157,143,255,0.45)',
    zIndex: 90,
    animation: 'pulse 3s ease-in-out infinite',
    transition: 'transform 0.2s ease',
  },
}
