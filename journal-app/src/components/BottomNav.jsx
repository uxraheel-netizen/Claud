const NAV_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9.5 L11 3 L19 9.5 V19 Q19 20 18 20 H14 V15 Q14 14 13 14 H9 Q8 14 8 15 V20 H4 Q3 20 3 19 Z"
          fill={active ? '#9D8FFF' : 'none'}
          stroke={active ? '#9D8FFF' : 'rgba(160,160,190,0.5)'}
          strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="5" width="16" height="15" rx="3"
          fill={active ? 'rgba(157,143,255,0.2)' : 'none'}
          stroke={active ? '#9D8FFF' : 'rgba(160,160,190,0.5)'} strokeWidth="1.6" />
        <path d="M3 9 H19" stroke={active ? '#9D8FFF' : 'rgba(160,160,190,0.5)'} strokeWidth="1.6" />
        <path d="M7 3 V6 M15 3 V6" stroke={active ? '#9D8FFF' : 'rgba(160,160,190,0.5)'} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="13" r="1.2" fill={active ? '#9D8FFF' : 'rgba(160,160,190,0.5)'} />
        <circle cx="11" cy="13" r="1.2" fill={active ? '#9D8FFF' : 'rgba(160,160,190,0.5)'} />
        <circle cx="14" cy="13" r="1.2" fill="rgba(157,143,255,0.4)" />
      </svg>
    ),
  },
  {
    id: 'mood',
    label: 'Mood',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 11 Q3 3 11 3 Q19 3 19 11 Q19 16 15 19 L11 20 L7 19 Q3 16 3 11 Z"
          fill={active ? 'rgba(255,181,99,0.2)' : 'none'}
          stroke={active ? '#FFB563' : 'rgba(160,160,190,0.5)'} strokeWidth="1.6" />
        <circle cx="8" cy="10" r="1.2" fill={active ? '#FFB563' : 'rgba(160,160,190,0.5)'} />
        <circle cx="14" cy="10" r="1.2" fill={active ? '#FFB563' : 'rgba(160,160,190,0.5)'} />
        <path d="M8 14 Q11 16.5 14 14" stroke={active ? '#FFB563' : 'rgba(160,160,190,0.5)'} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="9.5" cy="9.5" r="6"
          fill={active ? 'rgba(94,255,209,0.1)' : 'none'}
          stroke={active ? '#5EFFD1' : 'rgba(160,160,190,0.5)'} strokeWidth="1.6" />
        <path d="M14 14 L19 19" stroke={active ? '#5EFFD1' : 'rgba(160,160,190,0.5)'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4"
          fill={active ? 'rgba(255,126,179,0.2)' : 'none'}
          stroke={active ? '#FF7EB3' : 'rgba(160,160,190,0.5)'} strokeWidth="1.6" />
        <path d="M3 19 Q3 14 11 14 Q19 14 19 19"
          stroke={active ? '#FF7EB3' : 'rgba(160,160,190,0.5)'} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

const NAV_COLORS = {
  home: '#9D8FFF',
  calendar: '#9D8FFF',
  mood: '#FFB563',
  search: '#5EFFD1',
  settings: '#FF7EB3',
}

export default function BottomNav({ current, navigate }) {
  return (
    <div style={styles.nav}>
      {/* Blur backdrop */}
      <div style={styles.blur} />

      {NAV_ITEMS.map(item => {
        const active = current === item.id
        const color = NAV_COLORS[item.id]
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            style={{
              ...styles.item,
              background: active ? color + '18' : 'transparent',
            }}
          >
            {item.icon(active)}
            <span style={{
              fontSize: 9,
              fontWeight: active ? 700 : 500,
              color: active ? color : 'rgba(130,130,160,0.55)',
              transition: 'color 0.3s ease',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.2px',
            }}>
              {item.label}
            </span>
            {active && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
                animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }} />
            )}
          </button>
        )
      })}

      <style>{`
        @keyframes scaleIn {
          from { transform: translateX(-50%) scale(0); }
          to { transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  )
}

const styles = {
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 8px 12px',
    zIndex: 100,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(6,6,15,0.9)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
  },
  blur: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(6,6,15,0.85)',
    backdropFilter: 'blur(20px)',
    zIndex: -1,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '8px 14px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative',
    minWidth: 52,
  },
}
