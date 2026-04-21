import { useState, useEffect, useRef } from 'react'
import { entries, tags } from '../data/mockData'
import BottomNav from '../components/BottomNav'

export default function SearchScreen({ navigate }) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [visible, setVisible] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(true)
      setTimeout(() => inputRef.current?.focus(), 300)
    }, 60)
    return () => clearTimeout(t)
  }, [])

  const filtered = entries.filter(e => {
    const q = query.toLowerCase()
    const matchQuery = !q || e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || e.tags.some(t => t.includes(q))
    const matchTag = !activeTag || e.tags.includes(activeTag)
    return matchQuery && matchTag
  })

  const highlight = (text, q) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text.slice(0, 80)
    return text.slice(Math.max(0, idx - 20), idx + 80)
  }

  const POPULAR_TAGS = tags.slice(0, 8)

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={{
        ...styles.header,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'all 0.4s ease',
      }}>
        <div style={styles.title}>Search</div>
      </div>

      {/* Search input */}
      <div style={{
        padding: '0 20px 16px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.4s ease 0.05s',
      }}>
        <div style={{
          ...styles.inputWrapper,
          border: focused ? '1px solid rgba(157,143,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: focused ? '0 0 0 3px rgba(157,143,255,0.08)' : 'none',
          transition: 'all 0.2s ease',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7.5" cy="7.5" r="5.5" stroke="rgba(160,160,190,0.5)" strokeWidth="1.5" />
            <path d="M11.5 11.5 L15 15" stroke="rgba(160,160,190,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search entries, moods, tags..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.searchInput}
          />
          {query && (
            <button onClick={() => setQuery('')} style={styles.clearBtn}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3 L11 11 M11 3 L3 11" stroke="rgba(160,160,190,0.6)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tags filter */}
      <div style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease 0.1s',
      }}>
        <div style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 600, color: 'rgba(160,160,190,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Filter by tag
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {POPULAR_TAGS.map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
              padding: '7px 14px',
              borderRadius: 12,
              border: `1px solid ${activeTag === tag ? '#9D8FFF50' : 'rgba(255,255,255,0.08)'}`,
              background: activeTag === tag ? 'rgba(157,143,255,0.15)' : 'rgba(255,255,255,0.04)',
              color: activeTag === tag ? '#9D8FFF' : 'rgba(180,180,210,0.55)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: activeTag === tag ? 'scale(1.05)' : 'scale(1)',
              fontFamily: 'Inter, sans-serif',
            }}>
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results or empty state */}
      <div style={{
        flex: 1,
        padding: '0 20px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease 0.15s',
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}>
        {/* Result count */}
        {(query || activeTag) && (
          <div style={{ fontSize: 12, color: 'rgba(160,160,190,0.4)', fontWeight: 500, marginBottom: 12 }}>
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </div>
        )}

        {!query && !activeTag && (
          <div>
            <div style={styles.sectionLabel}>Recent entries</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 100 }}>
          {(query || activeTag ? filtered : entries).map((entry, i) => (
            <div
              key={entry.id}
              onClick={() => navigate('entry_detail', entry)}
              style={{
                ...styles.resultCard,
                borderColor: entry.color + '25',
                animation: `slideUp 0.3s ${i * 0.05}s both`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{entry.mood}</span>
                  <div>
                    <div style={styles.resultTitle}>{entry.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(160,160,190,0.4)', fontWeight: 500 }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: entry.color,
                  marginTop: 6,
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${entry.color}`,
                }} />
              </div>

              <p style={styles.resultText}>
                {highlight(entry.content, query)}
                {query && entry.content.toLowerCase().includes(query.toLowerCase()) ? (
                  <span style={{ color: 'rgba(200,200,240,0.4)' }}>...</span>
                ) : '...'}
              </p>

              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {entry.tags.map(t => (
                  <span key={t} onClick={ev => { ev.stopPropagation(); setActiveTag(t) }} style={{
                    padding: '3px 8px',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    border: `1px solid ${activeTag === t ? entry.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    color: activeTag === t ? entry.color : 'rgba(160,160,190,0.45)',
                    background: activeTag === t ? entry.color + '12' : 'transparent',
                    cursor: 'pointer',
                  }}>#{t}</span>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (query || activeTag) && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#E8E8FF', marginBottom: 6 }}>No results found</div>
              <div style={{ fontSize: 13, color: 'rgba(160,160,190,0.5)', textAlign: 'center' }}>
                Try different keywords or remove filters
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav current="search" navigate={navigate} />

      <style>{`
        input:focus { outline: none; }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
    overflow: 'hidden',
  },
  header: {
    padding: '52px 24px 12px',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#F0F0FF',
    fontFamily: 'Playfair Display, serif',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: '12px 16px',
    transition: 'all 0.2s ease',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    fontSize: 15,
    color: '#E8E8FF',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 400,
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(160,160,190,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 12,
  },
  resultCard: {
    padding: '14px 16px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#E8E8FF',
    marginBottom: 1,
  },
  resultText: {
    fontSize: 13,
    color: 'rgba(160,160,190,0.55)',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px 30px',
    textAlign: 'center',
  },
}
