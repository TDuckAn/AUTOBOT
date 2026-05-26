import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginSystem } from '../../api/auth.js'
import { getApiError } from '../../api/client.js'
import { getRole, setToken } from '../../hooks/useAuth.js'
import { Icons } from '../../components/icons.jsx'

function LoginField({ label, icon: Icon, children }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 5 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <Icon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', zIndex: 1 }} />
        {children}
      </div>
    </div>
  )
}

export function StaffLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginSystem(email, password)
      setToken(data.token)
      const role = getRole()
      navigate(role === 'Admin' ? '/admin/dashboard' : '/staff/queue')
    } catch (err) {
      setError(err.response?.status === 401 ? 'Email hoặc mật khẩu không đúng.' : getApiError(err, 'Không thể đăng nhập.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      <div style={{ flex: 1, background: 'var(--sidebar-bg)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={15} stroke="#fff" sw={2} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--sidebar-ink-hi)' }}>AutoWash Pro</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sidebar-ink)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Cổng nhân viên</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--sidebar-ink-hi)', lineHeight: 1.1, marginBottom: 32 }}>Bắt đầu<br />ca làm việc</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 36 }}>
          {[
            ['Hàng chờ', 'Live', 'var(--primary)'],
            ['Đang rửa', 'POS', 'var(--gold)'],
            ['Hoàn tất', 'API', 'var(--green)'],
          ].map(([label, value, color]) => (
            <div key={label} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--sidebar-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Geist Mono',monospace" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={submit} style={{ width: 400, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Đăng nhập nhân viên</div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 24 }}>Dùng email được cấp bởi quản lý ca.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <LoginField label="Email" icon={Icons.User}>
            <input className="aw-input" value={email} onChange={(event) => setEmail(event.target.value)} style={{ height: 40, fontSize: 14, paddingLeft: 32 }} autoComplete="username" />
          </LoginField>
          <LoginField label="Mật khẩu" icon={Icons.Lock}>
            <input className="aw-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} style={{ height: 40, fontSize: 14, paddingLeft: 32, paddingRight: 36 }} autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', color: 'var(--ink-400)', cursor: 'pointer' }}>
              <Icons.Eye size={15} />
            </button>
          </LoginField>
          {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
          <button className="aw-btn aw-btn-primary" disabled={loading} style={{ height: 40, width: '100%', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
            {loading ? 'Đang đăng nhập...' : 'Bắt đầu ca'} <Icons.ArrowRight size={14} />
          </button>
        </div>
      </form>
    </div>
  )
}
