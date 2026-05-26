import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginSystem } from '../../api/auth.js'
import { getApiError } from '../../api/client.js'
import { getRole, setToken } from '../../hooks/useAuth.js'
import { Icons } from '../../components/icons.jsx'

export function AdminLogin() {
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
      if (getRole() !== 'Admin') {
        localStorage.removeItem('aw_token')
        setError('Tài khoản này không có quyền quản trị.')
        return
      }
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.status === 401 ? 'Email hoặc mật khẩu không đúng.' : getApiError(err, 'Không thể đăng nhập.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      <form onSubmit={submit} style={{ width: 440, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 52px', background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={16} stroke="#fff" sw={2} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>AutoWash Pro</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Đăng nhập quản trị</div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 24 }}>Sử dụng tài khoản được cấp bởi hệ thống.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email"><input className="aw-input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ height: 40, fontSize: 14 }} autoComplete="username" /></Field>
          <Field label="Mật khẩu">
            <div style={{ position: 'relative' }}>
              <input className="aw-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} style={{ height: 40, fontSize: 14, paddingRight: 40 }} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, color: 'var(--ink-400)', cursor: 'pointer', padding: 4 }}><Icons.Eye size={15} /></button>
            </div>
          </Field>
          {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
          <button className="aw-btn aw-btn-primary" disabled={loading} style={{ height: 40, width: '100%', fontSize: 14, fontWeight: 600 }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'} <Icons.ArrowRight size={14} />
          </button>
        </div>
      </form>
      <div style={{ flex: 1, background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 52 }}>
        <div style={{ fontSize: 11, color: 'var(--sidebar-ink)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tổng quan · Hôm nay</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--sidebar-ink-hi)', marginBottom: 36 }}>Quản trị vận hành</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Doanh thu', 'Live API'], ['Lượt rửa', 'Queue'], ['Khuyến mãi', 'CRUD'], ['Khách hàng', 'Tier'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--sidebar-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--sidebar-ink)', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--sidebar-ink-hi)', fontFamily: "'Geist Mono',monospace" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  )
}
