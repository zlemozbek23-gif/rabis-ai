import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/chat', icon: '✨', label: 'AI Stilist' },
  { to: '/wardrobe', icon: '📸', label: 'Ön & Arka Stüdyo' },
]


export default function BottomNav() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '0 16px',
      paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      <nav style={{
        maxWidth: 420,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: 'rgba(14, 14, 18, 0.82)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 28,
        padding: '6px 8px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        pointerEvents: 'auto',
      }}>
        {tabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              borderRadius: 20,
              gap: 3,
              textDecoration: 'none',
              background: isActive
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.22) 0%, rgba(230, 198, 135, 0.08) 100%)'
                : 'transparent',
              color: isActive ? '#f8fafc' : 'rgba(255, 255, 255, 0.45)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              border: isActive ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid transparent',
              WebkitTapHighlightColor: 'transparent',
            })}
          >
            <span style={{
              fontSize: 20,
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
              transform: 'scale(1)',
              transition: 'transform 0.2s',
            }}>
              {icon}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
