import { useState, useEffect } from 'react'
import { calendarEntryDates, calendarMoods, entries } from '../data/mockData'
import BottomNav from '../components/BottomNav'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarScreen({ navigate }) {
  const [month, setMonth] = useState(3) // April
  const [year] = useState(2026)
  const [selected, setSelected] = useState(21)
  const [visible, setVisible] = useState(false)
  const [animDir, setAnimDir] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const changeMonth = (dir) => {
    setAnimDir(dir)
    setVisible(false)
    setTimeout(() => {
      setMonth(m => Math.max(0, Math.min(11, m + dir)))
      setVisible(true)
    }, 250)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const selectedEntry = entries.find(e => {
    const d = new Date(e.date)
    return d.getDate() === selected && d.getMonth() === month
  })

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={{
        ...styles.header,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={styles.headerLeft}>
          <div style={styles.monthYear}>{MONTHS[month]}</div>
          <div style={styles.yearLabel}>{year}</div>
        </div>
        <div style={styles.navBtns}>
          <button onClick={() => changeMonth(-1)} style={styles.navBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4 L6 9 L11 14" stroke="rgba(200,200,240,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={() => changeMonth(1)} style={styles.navBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4 L12 9 L7 14" stroke="rgba(200,200,240,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div style={styles.dayLabels}>
        {DAYS.map(d => (
          <div key={d} style={styles.dayLabel}>{d.slice(0, 1)}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        ...styles.grid,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : `translateX(${animDir * 30}px)`,
        transition: 'all 0.25s ease',
      }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const hasEntry = calendarEntryDates.includes(day)
          const isSelected = day === selected
          const isToday = day === 21 && month === 3
          const moodColor = calendarMoods[day]

          return (
            <div
              key={day}
              onClick={() => setSelected(day)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasEntry ? 'pointer' : 'default',
                background: isSelected
                  ? (moodColor ? moodColor + '25' : 'rgba(157,143,255,0.2)')
                  : 'transparent',
                border: isSelected
                  ? `1.5px solid ${moodColor || '#9D8FFF'}80`
                  : isToday ? '1px solid rgba(157,143,255,0.3)' : '1px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: hasEntry ? `calendarCellPop 0.35s ${i * 0.015}s both` : 'none',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: isSelected || isToday ? 700 : 400,
                color: isSelected
                  ? (moodColor || '#9D8FFF')
                  : isToday
                    ? '#9D8FFF'
                    : day < 21 ? 'rgba(200,200,240,0.8)' : 'rgba(200,200,240,0.4)',
              }}>{day}</span>
              {hasEntry && (
                <div style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: moodColor || '#9D8FFF',
                  marginTop: 2,
                  boxShadow: `0 0 6px ${moodColor || '#9D8FFF'}`,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day entry preview */}
      <div style={{
        padding: '0 20px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease 0.2s',
      }}>
        {selectedEntry ? (
          <div
            onClick={() => navigate('entry_detail', selectedEntry)}
            style={{
              ...styles.previewCard,
              borderColor: selectedEntry.color + '40',
            }}
          >
            <div style={styles.previewLeft}>
              <div style={{
                width: 4,
                alignSelf: 'stretch',
                borderRadius: 3,
                background: selectedEntry.color,
                boxShadow: `0 0 12px ${selectedEntry.color}60`,
                flexShrink: 0,
              }} />
              <div>
                <div style={styles.previewTitle}>{selectedEntry.title}</div>
                <div style={styles.previewText}>{selectedEntry.content.slice(0, 70)}...</div>
                <div style={styles.previewMeta}>
                  <span style={{ color: selectedEntry.color }}>{selectedEntry.mood} {selectedEntry.moodLabel}</span>
                  <span style={styles.previewDate}>{selectedEntry.readTime}</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 16, color: 'rgba(200,200,240,0.3)' }}>→</div>
          </div>
        ) : (
          <div style={styles.emptyDay}>
            <div style={styles.emptyIcon}>📝</div>
            <div style={styles.emptyText}>No entry for this day</div>
            <button onClick={() => navigate('new_entry')} style={styles.addBtn}>
              Write entry
            </button>
          </div>
        )}
      </div>

      {/* Month stats */}
      <div style={{
        display: 'flex',
        gap: 10,
        padding: '14px 20px 100px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease 0.3s',
      }}>
        {[
          { label: 'Entries', value: '10', color: '#9D8FFF' },
          { label: 'Streak', value: '12d 🔥', color: '#FFB563' },
          { label: 'Avg mood', value: '4.1', color: '#5EFFD1' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1,
            padding: '10px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(160,160,190,0.5)', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <BottomNav current="calendar" navigate={navigate} />

      <style>{`
        @keyframes calendarCellPop {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
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
    overflowY: 'auto',
    scrollbarWidth: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '52px 24px 16px',
  },
  headerLeft: {},
  monthYear: {
    fontSize: 26,
    fontWeight: 800,
    color: '#F0F0FF',
    fontFamily: 'Playfair Display, serif',
  },
  yearLabel: {
    fontSize: 13,
    color: 'rgba(160,160,190,0.5)',
    fontWeight: 500,
    marginTop: 1,
  },
  navBtns: {
    display: 'flex',
    gap: 8,
  },
  navBtn: {
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
  dayLabels: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    padding: '0 16px 8px',
  },
  dayLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(160,160,190,0.4)',
    padding: '4px 0',
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
    padding: '0 16px 16px',
  },
  previewCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: 2,
    animation: 'fadeInScale 0.3s ease',
  },
  previewLeft: {
    display: 'flex',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#E8E8FF',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 12,
    color: 'rgba(160,160,190,0.55)',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  previewMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    fontWeight: 600,
  },
  previewDate: {
    color: 'rgba(160,160,190,0.4)',
  },
  emptyDay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '20px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.02)',
    border: '1px dashed rgba(255,255,255,0.08)',
  },
  emptyIcon: {
    fontSize: 28,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(160,160,190,0.4)',
    fontWeight: 500,
  },
  addBtn: {
    marginTop: 4,
    padding: '8px 20px',
    borderRadius: 12,
    background: 'rgba(157,143,255,0.12)',
    border: '1px solid rgba(157,143,255,0.3)',
    color: '#9D8FFF',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
}
