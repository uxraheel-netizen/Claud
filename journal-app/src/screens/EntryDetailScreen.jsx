import { useState, useEffect } from 'react'
import { entries } from '../data/mockData'

export default function EntryDetailScreen({ navigate, selectedEntry }) {
  const entry = selectedEntry || entries[0]
  const [visible, setVisible] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeAnim, setLikeAnim] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const handleLike = () => {
    setLiked(l => !l)
    setLikeAnim(true)
    setTimeout(() => setLikeAnim(false), 600)
  }

  const date = new Date(entry.date)
  const formatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const paragraphs = entry.content.split('\n\n').filter(Boolean)

  return (
    <div style={styles.screen}>
      {/* Hero header */}
      <div style={{
        ...styles.hero,
        background: `radial-gradient(ellipse at 50% 100%, ${entry.color}20 0%, transparent 65%), #0C0C1E`,
      }}>
        {/* Back button */}
        <button onClick={() => navigate('home')} style={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4 L7 10 L13 16" stroke="rgba(220,220,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Mood orb */}
        <div style={{
          ...styles.moodOrb,
          background: `radial-gradient(circle, ${entry.color}40 0%, ${entry.color}10 60%, transparent 80%)`,
          boxShadow: `0 0 60px ${entry.color}30`,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.7)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <span style={{ fontSize: 48 }}>{entry.mood}</span>
        </div>

        {/* Mood label */}
        <div style={{
          ...styles.moodBadge,
          background: entry.color + '22',
          borderColor: entry.color + '50',
          color: entry.color,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.5s ease 0.2s',
        }}>
          {entry.moodLabel}
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {/* Date */}
        <div style={{
          padding: '20px 24px 0',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.4s ease 0.15s',
        }}>
          <div style={styles.dateStr}>{formatted}</div>
        </div>

        {/* Title */}
        <div style={{
          padding: '10px 24px 16px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.4s ease 0.2s',
        }}>
          <h1 style={styles.title}>{entry.title}</h1>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          margin: '0 24px 20px',
          background: `linear-gradient(90deg, ${entry.color}50, transparent)`,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease 0.25s',
        }} />

        {/* Content paragraphs */}
        <div style={{ padding: '0 24px' }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{
              ...styles.paragraph,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: `all 0.4s ease ${0.3 + i * 0.08}s`,
            }}>{para}</p>
          ))}
        </div>

        {/* Meta stats */}
        <div style={{
          display: 'flex',
          gap: 12,
          padding: '20px 24px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease 0.5s',
        }}>
          {[
            { label: 'Words', value: entry.wordCount },
            { label: 'Read time', value: entry.readTime },
          ].map(m => (
            <div key={m.label} style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: entry.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(160,160,190,0.5)', fontWeight: 500, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: '0 24px 20px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease 0.55s',
        }}>
          {entry.tags.map(t => (
            <span key={t} style={{
              padding: '6px 14px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              border: `1px solid ${entry.color}40`,
              color: entry.color,
              background: entry.color + '12',
            }}>#{t}</span>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ height: 80 }} />
      </div>

      {/* Bottom action bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 24px 30px',
        background: 'linear-gradient(to top, #06060F 60%, transparent)',
        display: 'flex',
        gap: 12,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.4s ease 0.6s',
      }}>
        <button onClick={handleLike} style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: liked ? 'rgba(255,107,138,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${liked ? '#FF6B8A50' : 'rgba(255,255,255,0.1)'}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          transition: 'all 0.25s ease',
          transform: likeAnim ? 'scale(1.3)' : 'scale(1)',
        }}>
          {liked ? '❤️' : '🤍'}
        </button>

        <button onClick={() => navigate('new_entry')} style={{
          flex: 1,
          height: 48,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${entry.color}DD, ${entry.color}99)`,
          border: 'none',
          color: '#000',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'transform 0.2s ease',
          boxShadow: `0 8px 24px ${entry.color}40`,
        }}>
          Continue writing
        </button>

        <button style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9 L4 14 Q4 15 5 15 L13 15 Q14 15 14 14 L14 9" stroke="rgba(200,200,240,0.6)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M9 3 L9 11 M6 6 L9 3 L12 6" stroke="rgba(200,200,240,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
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
    position: 'relative',
    overflow: 'hidden',
  },
  hero: {
    height: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodOrb: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'float 4s ease-in-out infinite',
  },
  moodBadge: {
    marginTop: 8,
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    border: '1px solid',
    letterSpacing: '0.3px',
  },
  dateStr: {
    fontSize: 12,
    color: 'rgba(160,160,190,0.5)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    fontFamily: 'Playfair Display, serif',
    color: '#F0F0FF',
    lineHeight: 1.2,
    letterSpacing: '-0.3px',
  },
  paragraph: {
    fontSize: 15,
    color: 'rgba(210,210,240,0.75)',
    lineHeight: 1.8,
    fontWeight: 400,
    marginBottom: 18,
    letterSpacing: '0.1px',
  },
}
