import { useState, useEffect } from 'react'
import { stats } from '../data/mockData'
import BottomNav from '../components/BottomNav'

function Toggle({ on, onChange, color = '#9D8FFF' }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? color : 'rgba(255,255,255,0.1)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s ease',
        flexShrink: 0,
        boxShadow: on ? `0 0 12px ${color}50` : 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#fff',
        top: 3,
        left: on ? 21 : 3,
        transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}

const THEMES = [
  { name: 'Cosmos', color: '#9D8FFF', bg: '#06060F' },
  { name: 'Ember', color: '#FFB563', bg: '#0F0805' },
  { name: 'Ocean', color: '#5EC5FF', bg: '#050C0F' },
  { name: 'Forest', color: '#5EFFD1', bg: '#050F0A' },
]

export default function SettingsScreen({ navigate }) {
  const [visible, setVisible] = useState(false)
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    dailyReminder: true,
    haptics: true,
    autoSave: true,
    privateMode: false,
  })
  const [selectedTheme, setSelectedTheme] = useState(0)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('Alex')

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }))

  const SECTIONS = [
    {
      title: 'Writing',
      items: [
        { key: 'notifications', label: 'Daily reminder', sub: '9:00 PM every day', icon: '🔔', color: '#FFB563' },
        { key: 'autoSave', label: 'Auto-save drafts', sub: 'Save while you type', icon: '💾', color: '#5EFFD1' },
        { key: 'haptics', label: 'Haptic feedback', sub: 'Subtle vibrations', icon: '📳', color: '#9D8FFF' },
      ]
    },
    {
      title: 'Privacy',
      items: [
        { key: 'privateMode', label: 'Lock app', sub: 'Require biometric to open', icon: '🔐', color: '#FF7EB3' },
        { key: 'darkMode', label: 'Dark mode', sub: 'Always on', icon: '🌙', color: '#9D8FFF' },
      ]
    },
  ]

  return (
    <div style={styles.screen}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 280,
        background: `radial-gradient(ellipse at 50% 0%, ${THEMES[selectedTheme].color}15 0%, transparent 70%)`,
        transition: 'background 0.6s ease',
        pointerEvents: 'none',
      }} />

      <div style={{ overflowY: 'auto', scrollbarWidth: 'none', height: '100%' }}>
        {/* Header */}
        <div style={{
          padding: '52px 24px 0',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={styles.pageLabel}>Settings</div>
        </div>

        {/* Profile card */}
        <div style={{
          margin: '16px 20px',
          padding: '20px',
          borderRadius: 24,
          background: `linear-gradient(135deg, ${THEMES[selectedTheme].color}18, rgba(255,255,255,0.03))`,
          border: `1px solid ${THEMES[selectedTheme].color}25`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.05s',
          position: 'relative',
          zIndex: 1,
          boxShadow: `0 8px 40px ${THEMES[selectedTheme].color}15`,
        }}>
          {/* Avatar */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 22,
            background: `linear-gradient(135deg, ${THEMES[selectedTheme].color}40, ${THEMES[selectedTheme].color}20)`,
            border: `2px solid ${THEMES[selectedTheme].color}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            animation: 'float 4s ease-in-out infinite',
            flexShrink: 0,
          }}>🌙</div>

          <div style={{ flex: 1 }}>
            {editingName ? (
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${THEMES[selectedTheme].color}50`,
                  borderRadius: 10,
                  padding: '6px 12px',
                  color: '#E8E8FF',
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: 'Playfair Display, serif',
                  width: '100%',
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={styles.profileName}>{name}</div>
                <button onClick={() => setEditingName(true)} style={styles.editBtn}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8 2 L10 4 L4 10 L2 10 L2 8 Z" stroke="rgba(200,200,240,0.5)" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
            <div style={styles.profileSub}>Journaling since Jan 2026</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: 10,
          padding: '0 20px 20px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease 0.1s',
        }}>
          {[
            { label: 'Entries', value: stats.totalEntries, emoji: '📖' },
            { label: 'Streak', value: `${stats.currentStreak}d`, emoji: '🔥' },
            { label: 'Words', value: `${(stats.totalWords / 1000).toFixed(1)}k`, emoji: '✍️' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1,
              padding: '12px 8px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: THEMES[selectedTheme].color,
                marginBottom: 2,
              }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(160,160,190,0.45)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Theme picker */}
        <div style={{
          padding: '0 20px 20px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease 0.15s',
        }}>
          <div style={styles.sectionHeader}>Appearance</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {THEMES.map((theme, i) => (
              <div key={theme.name} onClick={() => setSelectedTheme(i)} style={{
                flex: 1,
                height: 56,
                borderRadius: 16,
                background: `linear-gradient(135deg, ${theme.color}30, ${theme.color}10)`,
                border: `1.5px solid ${i === selectedTheme ? theme.color : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: i === selectedTheme ? 'scale(1.06)' : 'scale(1)',
                boxShadow: i === selectedTheme ? `0 0 20px ${theme.color}30` : 'none',
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: theme.color }} />
                <span style={{ fontSize: 9, color: i === selectedTheme ? theme.color : 'rgba(180,180,210,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {theme.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings sections */}
        {SECTIONS.map((section, si) => (
          <div key={section.title} style={{
            padding: '0 20px 16px',
            opacity: visible ? 1 : 0,
            transition: `opacity 0.4s ease ${0.2 + si * 0.05}s`,
          }}>
            <div style={styles.sectionHeader}>{section.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {section.items.map((item, i) => (
                <div key={item.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  animation: `slideUp 0.3s ${0.25 + si * 0.05 + i * 0.04}s both`,
                }}
                  onClick={() => toggle(item.key)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: item.color + '18',
                    border: `1px solid ${item.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#E8E8FF' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(160,160,190,0.45)', marginTop: 1 }}>{item.sub}</div>
                  </div>
                  <Toggle on={settings[item.key]} onChange={() => toggle(item.key)} color={item.color} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Danger zone */}
        <div style={{ padding: '0 20px 120px', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.35s' }}>
          <div style={styles.sectionHeader}>Data</div>
          {['Export journal (PDF)', 'Import entries', 'Clear all data'].map((label, i) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              marginBottom: 4,
              borderRadius: 16,
              background: i === 2 ? 'rgba(255,107,138,0.04)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${i === 2 ? 'rgba(255,107,138,0.15)' : 'rgba(255,255,255,0.06)'}`,
              cursor: 'pointer',
            }}>
              <span style={{
                fontSize: 14,
                fontWeight: 500,
                color: i === 2 ? '#FF6B8A' : 'rgba(200,200,240,0.7)',
              }}>{label}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4 L10 8 L6 12" stroke={i === 2 ? 'rgba(255,107,138,0.5)' : 'rgba(160,160,190,0.3)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <BottomNav current="settings" navigate={navigate} />

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
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
    position: 'relative',
    overflow: 'hidden',
  },
  pageLabel: {
    fontSize: 28,
    fontWeight: 800,
    color: '#F0F0FF',
    fontFamily: 'Playfair Display, serif',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 800,
    color: '#F0F0FF',
    fontFamily: 'Playfair Display, serif',
  },
  profileSub: {
    fontSize: 12,
    color: 'rgba(160,160,190,0.45)',
    fontWeight: 500,
    marginTop: 2,
  },
  editBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(160,160,190,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: 10,
    paddingLeft: 4,
  },
}
