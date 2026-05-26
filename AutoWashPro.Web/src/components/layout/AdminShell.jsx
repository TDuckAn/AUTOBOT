import { useNavigate } from 'react-router-dom'
import { clearToken } from '../../hooks/useAuth.js'
import { Icons } from '../icons.jsx'

const NAV = [
  { id: 'dashboard', icon: 'Dashboard', label: 'Tổng quan', path: '/admin/dashboard' },
  { id: 'services', icon: 'Box', label: 'Dịch vụ & giá', path: '/admin/services' },
  { id: 'promotions', icon: 'Tag', label: 'Khuyến mãi', path: '/admin/promotions' },
  { id: 'tiers', icon: 'Layers', label: 'Hạng thành viên', path: '/admin/tiers' },
  { id: 'customers', icon: 'Users', label: 'Khách hàng', path: '/admin/customers' },
]

export function AdminShell({ active, title, subtitle, children, headerActions }) {
  const navigate = useNavigate()
  const logout = () => {
    clearToken()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'inherit' }}>
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column', padding: '14px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 18px' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={14} stroke="#fff" sw={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sidebar-ink-hi)', lineHeight: 1 }}>AutoWash Pro</div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', marginTop: 2, letterSpacing: '0.04em' }}>QUẢN TRỊ</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--sidebar-border)', marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--sidebar-ink-hi)', fontWeight: 500, flex: 1 }}>CN Quận 3</span>
          <Icons.ChevronRight size={12} stroke="var(--sidebar-ink)" style={{ transform: 'rotate(90deg)' }} />
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sidebar-ink)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 6px' }}>Vận hành</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {NAV.map((item) => {
            const Icon = Icons[item.icon]
            const isActive = item.id === active
            return (
              <button key={item.id} className={`aw-nav-item${isActive ? ' active' : ''}`} onClick={() => navigate(item.path)}>
                <Icon size={15} sw={isActive ? 2 : 1.7} />
                {item.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderTop: '1px solid var(--sidebar-border)', paddingTop: 10, marginTop: 10 }}>
          <button className="aw-nav-item" onClick={logout}><Icons.LogOut size={15} />Đăng xuất</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 2px', marginTop: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'oklch(45% 0.02 240)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>AD</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--sidebar-ink-hi)' }}>Quản trị viên</div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-ink)' }}>AutoWash Pro</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        <header style={{
          height: 52, flexShrink: 0, padding: '0 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
              {subtitle && <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{subtitle}</span>}
            </div>
          </div>
          <div style={{ position: 'relative', width: 220 }}>
            <Icons.Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
            <input className="aw-input" placeholder="Tìm kiếm..." style={{ paddingLeft: 30, height: 30, fontSize: 12 }} />
          </div>
          {headerActions}
        </header>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}
