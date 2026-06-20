import { useNavigate } from 'react-router-dom'
import { clearToken, getDisplayName } from '../../hooks/useAuth.js'
import { Icons } from '../icons.jsx'

const NAV = [
  { id: 'dashboard', icon: 'Dashboard', label: 'Tổng quan', path: '/customer/dashboard' },
  { id: 'bookings', icon: 'Calendar', label: 'Đặt lịch & Lịch sử', path: '/customer/bookings' },
  { id: 'vehicles', icon: 'Bike', label: 'Xe của tôi', path: '/customer/vehicles' },
  { id: 'rewards', icon: 'Gift', label: 'Điểm & Ưu đãi', path: '/customer/rewards' },
]

export function CustomerShell({ active, title, children, headerActions }) {
  const navigate = useNavigate()
  const displayName = getDisplayName()

  const logout = () => {
    clearToken()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'inherit' }}>
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column', padding: '14px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 18px' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={14} stroke="#fff" sw={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sidebar-ink-hi)', lineHeight: 1 }}>AutoWash Pro</div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', marginTop: 2, letterSpacing: '0.04em' }}>THÀNH VIÊN</div>
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sidebar-ink)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 6px' }}>Tài khoản</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {NAV.map((item) => {
            const Icon = Icons[item.icon]
            const isActive = item.id === active
            return (
              <button
                key={item.id}
                className={`aw-nav-item${isActive ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={15} sw={isActive ? 2 : 1.7} />
                {item.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderTop: '1px solid var(--sidebar-border)', paddingTop: 10, marginTop: 10 }}>
          <button className="aw-nav-item" onClick={logout}>
            <Icons.LogOut size={15} />Đăng xuất
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 2px', marginTop: 4 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {displayName?.[0]?.toUpperCase() ?? 'K'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-ink-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName || 'Khách hàng'}</div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-ink)' }}>Thành viên</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <header style={{
          height: 52, flexShrink: 0, padding: '0 24px', background: 'var(--surface)',
          borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
          </div>
          {headerActions}
        </header>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}
