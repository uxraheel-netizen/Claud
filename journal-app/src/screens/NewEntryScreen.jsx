import { useState, useRef, useEffect } from 'react'

const MOODS = [
  { emoji: '😔', label: 'Low', color: '#5EC5FF' },
  { emoji: '😕', label: 'Meh', color: '#9D8FFF' },
  { emoji: '😌', label: 'Okay', color: '#FFB563' },
  { emoji: '😊', label: 'Good', color: '#5EFFD1' },
  { emoji: '🤩', label: 'Great', color: '#FF7EB3' },
]

const TAGS_PRESET = ['gratitude', 'morning', 'health', 'growth', 'work', 'relationships', 'creativity', 'dreams']

const PROMPTS = [
  "What made you smile today?",
  "Describe a moment of clarity you had recently.",
  "What's something you're proud of this week?",
  "Write about something you're looking forward to.",
  "What's weighing on your mind right now?",
]

export default function NewEntryScreen({ navigate }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(null)
  const [tags, setTags] = useState([])
  const [showPrompts, setShowPrompts] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [visible, setVisible] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const textRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(true); textRef.current?.focus() }, 100)
    return () => clearTimeout(t)
  }, [])

  const handleContent = (e) => {
    const val = e.target.value
    setContent(val)
    setWordCount(val.trim() ? val.trim().split(/\s+/).length : 0)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => navigate('home'), 1200)
  }

  const toggleTag = (tag) => {
    setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])
  }

  const usePrompt = (p) => {
    setContent(prev => prev ? prev + '\n\n' + p + '\n' : p + '\n')
    setShowPrompts(false)
    textRef.current?.focus()
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={styles.screen}>
      {/* Top bar */}
      <div style={{
        ...styles.topBar,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'all 0.4s ease',
      }}>
        <button onClick={() => navigate('home')} style={styles.backBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 6 L9 12 L15 18" stroke="rgba(200,200,240,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={styles.topDate}>{today}</div>
        <button onClick={handleSave} style={{
          ...styles.saveBtn,
          background: content.length > 5
            ? 'linear-gradient(135deg, #9D8FFF, #FF7EB3)'
            : 'rgba(255,255,255,0.08)',
        }}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      {/* Mood selector */}
      <div style={{
        ...styles.moodBar,
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s ease 0.1s',
      }}>
        <span style={styles.moodLabel}>Mood</span>
        <div style={styles.moodItems}>
          {MOODS.map((m, i) => (
            <button key={i} onClick={() => setMood(i)} style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: `1.5px solid ${mood === i ? m.color : 'rgba(255,255,255,0.08)'}`,
              background: mood === i ? m.color + '22' : 'transparent',
              fontSize: 20,
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: mood === i ? 'scale(1.2)' : 'scale(1)',
              boxShadow: mood === i ? `0 0 16px ${m.color}50` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>{m.emoji}</button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div style={{
        ...styles.titleWrapper,
        opacity: visible ? 1 : 0,
        transition: 'all 0.4s ease 0.15s',
      }}>
        <input
          type="text"
          placeholder="Give this moment a title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={styles.titleInput}
        />
      </div>

      {/* Word count */}
      <div style={{ padding: '0 24px 8px', opacity: 0.4, fontSize: 12, color: '#9090BB' }}>
        {wordCount > 0 ? `${wordCount} words` : 'Start writing...'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 24px', position: 'relative' }}>
        <textarea
          ref={textRef}
          placeholder="What's on your mind today? Let it all out — no judgment here..."
          value={content}
          onChange={handleContent}
          style={styles.contentArea}
        />
        {/* Blinking cursor overlay when empty */}
        {content === '' && (
          <div style={{
            position: 'absolute',
            top: 4,
            left: 24,
            width: 2,
            height: 22,
            background: '#9D8FFF',
            borderRadius: 1,
            animation: 'blink 1s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Tags row */}
      {tags.length > 0 && (
        <div style={styles.tagRow}>
          {tags.map(t => (
            <span key={t} onClick={() => toggleTag(t)} style={styles.activeTag}>#{t} ×</span>
          ))}
        </div>
      )}

      {/* Prompts dropdown */}
      {showPrompts && (
        <div style={styles.dropdown}>
          {PROMPTS.map((p, i) => (
            <div key={i} onClick={() => usePrompt(p)} style={styles.promptItem}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(157,143,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: '#9D8FFF', marginRight: 8 }}>✦</span>
              {p}
            </div>
          ))}
        </div>
      )}

      {/* Tag picker dropdown */}
      {showTagPicker && (
        <div style={styles.tagPickerDropdown}>
          {TAGS_PRESET.map(t => (
            <span key={t} onClick={() => toggleTag(t)} style={{
              padding: '6px 12px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${tags.includes(t) ? '#9D8FFF' : 'rgba(255,255,255,0.1)'}`,
              background: tags.includes(t) ? 'rgba(157,143,255,0.15)' : 'rgba(255,255,255,0.04)',
              color: tags.includes(t) ? '#9D8FFF' : 'rgba(200,200,230,0.6)',
              transition: 'all 0.2s ease',
            }}>#{t}</span>
          ))}
        </div>
      )}

      {/* Bottom toolbar */}
      <div style={styles.toolbar}>
        <button onClick={() => { setShowPrompts(s => !s); setShowTagPicker(false) }} style={{
          ...styles.toolBtn,
          color: showPrompts ? '#9D8FFF' : 'rgba(200,200,230,0.5)',
          background: showPrompts ? 'rgba(157,143,255,0.12)' : 'transparent',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 6 V9.5 M9 12 V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Prompts
        </button>
        <button onClick={() => { setShowTagPicker(s => !s); setShowPrompts(false) }} style={{
          ...styles.toolBtn,
          color: showTagPicker ? '#FFB563' : 'rgba(200,200,230,0.5)',
          background: showTagPicker ? 'rgba(255,181,99,0.12)' : 'transparent',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9 L9 2 L16 9 L9 16 Z" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
          </svg>
          Tags
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: 'rgba(140,140,170,0.4)', fontWeight: 500 }}>
          {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Save success overlay */}
      {saved && (
        <div style={styles.savedOverlay}>
          <div style={styles.savedBadge}>
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="rgba(94,255,209,0.2)" stroke="#5EFFD1" strokeWidth="1.5" />
              <path d="M10 16 L14.5 21 L22 11" stroke="#5EFFD1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="30" style={{ animation: 'checkDraw 0.4s 0.1s ease forwards', strokeDashoffset: 30 }} />
            </svg>
            <span style={{ color: '#5EFFD1', fontSize: 15, fontWeight: 700 }}>Saved beautifully</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
        @keyframes checkDraw { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }
        textarea:focus { outline: none; }
        input:focus { outline: none; }
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
    position: 'relative',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '52px 20px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topDate: {
    fontSize: 13,
    color: 'rgba(200,200,240,0.45)',
    fontWeight: 500,
  },
  saveBtn: {
    padding: '8px 18px',
    borderRadius: 12,
    border: 'none',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Inter, sans-serif',
  },
  moodBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  moodLabel: {
    fontSize: 12,
    color: 'rgba(160,160,190,0.5)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    minWidth: 36,
  },
  moodItems: {
    display: 'flex',
    gap: 8,
  },
  titleWrapper: {
    padding: '20px 24px 0',
  },
  titleInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    fontSize: 22,
    fontWeight: 700,
    color: '#E8E8FF',
    fontFamily: 'Playfair Display, serif',
    letterSpacing: '-0.3px',
  },
  contentArea: {
    width: '100%',
    height: '100%',
    minHeight: 160,
    background: 'transparent',
    border: 'none',
    resize: 'none',
    fontSize: 15,
    color: 'rgba(220,220,245,0.75)',
    lineHeight: 1.75,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
    paddingTop: 4,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    padding: '8px 24px',
  },
  activeTag: {
    padding: '4px 10px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(157,143,255,0.12)',
    border: '1px solid rgba(157,143,255,0.3)',
    color: '#9D8FFF',
    cursor: 'pointer',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '10px 16px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s ease',
  },
  dropdown: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    background: '#141428',
    border: '1px solid rgba(157,143,255,0.2)',
    borderRadius: 16,
    padding: 8,
    zIndex: 50,
    animation: 'slideUp 0.25s ease',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  promptItem: {
    padding: '12px 14px',
    borderRadius: 10,
    fontSize: 13,
    color: 'rgba(200,200,240,0.7)',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    lineHeight: 1.4,
  },
  tagPickerDropdown: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    animation: 'slideUp 0.25s ease',
  },
  savedOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(6,6,15,0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    animation: 'fadeIn 0.2s ease',
  },
  savedBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
}
