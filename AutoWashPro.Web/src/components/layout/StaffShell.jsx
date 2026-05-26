import { useNavigate } from 'react-router-dom'
import { clearToken } from '../../hooks/useAuth.js'
import { Icons } from '../icons.jsx'

const NAV = [
  { id: 'queue', icon: 'Calendar', label: 'Hàng chờ', path: '/staff/queue' },
  { id: 'walkin', icon: 'Plus', label: 'Khách vãng lai', path: '/staff/walkin' },
  { id: 'history', icon: 'Receipt', label: 'Danh sách', path: '/staff/list' },
]

export function StaffShell({ active, children, title, headerRight, queueCount = 0 }) {
  const navigate = useNavigate()
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  const logout = () => {
    clearToken()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <aside style={{
        width: 200, flexShrink: 0, background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column', padding: '14px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 20px' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={14} stroke="#fff" sw={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sidebar-ink-hi)', lineHeight: 1 }}>AutoWash</div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', marginTop: 2, letterSpacing: '0.04em' }}>NHÂN VIÊN</div>
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sidebar-ink)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 6px' }}>Hôm nay</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {NAV.map((item) => {
            const Icon = Icons[item.icon]
            const isActive = item.id === active
            return (
              <button key={item.id} onClick={() => navigate(item.path)} className={`aw-nav-item${isActive ? ' active' : ''}`} style={{ justifyContent: 'flex-start', position: 'relative' }}>
                <Icon size={15} sw={isActive ? 2 : 1.7} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.id === 'queue' && queueCount > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, borderRadius: 9, background: 'var(--primary)', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Geist Mono',monospace",
                  }}>{queueCount}</span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="aw-nav-item" onClick={logout}><Icons.LogOut size={15} />Đăng xuất</button>
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sidebar-border)' }}>
            <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', marginBottom: 2 }}>Ca hiện tại</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-ink-hi)', fontFamily: "'Geist Mono',monospace" }}>07:00 - 15:00</div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: 52, flexShrink: 0, padding: '0 22px', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{today}</span>
          </div>
          {headerRight}
        </header>
        <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  )
}
