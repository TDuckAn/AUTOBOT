import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginCustomer, loginSystem, registerCustomer } from '../api/auth.js'
import { getApiError } from '../api/client.js'
import { Icons } from '../components/icons.jsx'
import { clearToken, getRole, setToken } from '../hooks/useAuth.js'

const CUSTOMER_FEATURES = [
  ['Đặt lịch theo khung giờ', 'Chọn xe, gói rửa và khung giờ còn trống trước khi đến tiệm.'],
  ['Theo dõi điểm thưởng', 'Xem điểm hiện có, hạng thành viên và ưu đãi đang áp dụng cho tài khoản.'],
  ['Quản lý xe cá nhân', 'Lưu biển số, loại xe và xem lại lịch sử rửa xe của từng xe.'],
]

export function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('customer')   // 'customer' | 'system'
  const [mode, setMode] = useState('login')  // 'login' | 'register' (customer only)

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setError(''); setEmail(''); setPhone(''); setFullName(''); setPassword(''); setShowPass(false)
  }

  const switchTab = (t) => { setTab(t); setMode('login'); reset() }
  const switchMode = (m) => { setMode(m); reset() }

  const submitSystem = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginSystem(email, password)
      setToken(data.token, data.displayName)
      const role = getRole()
      if (role === 'Admin') navigate('/admin/dashboard')
      else if (role === 'Staff') navigate('/staff/queue')
      else { clearToken(); setError('Tài khoản này không được phép truy cập hệ thống.') }
    } catch (err) {
      setError(err.response?.status === 401 ? 'Email hoặc mật khẩu không đúng.' : getApiError(err, 'Không thể đăng nhập.'))
    } finally {
      setLoading(false)
    }
  }

  const submitCustomer = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = mode === 'register'
        ? { fullName, phoneNumber: phone, password }
        : { phoneNumber: phone, password }
      const data = mode === 'register'
        ? await registerCustomer(payload)
        : await loginCustomer(payload)
      setToken(data.token, data.displayName)
      navigate('/customer/dashboard')
    } catch (err) {
      const fallback = mode === 'register' ? 'Không thể đăng ký.' : 'Không thể đăng nhập.'
      setError(err.response?.status === 401 ? 'Số điện thoại hoặc mật khẩu không đúng.' : getApiError(err, fallback))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', fontFamily: 'inherit' }}>
      <div className="aw-login-left" style={{
        flex: 1,
        background: 'var(--sidebar-bg)',
        padding: 'clamp(44px, 4.5vw, 84px) clamp(42px, 5vw, 96px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.032) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 'clamp(520px, 48vw, 820px)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 0.9vw, 15px)', marginBottom: 'clamp(42px, 4vw, 72px)' }}>
            <div style={{ width: 'clamp(38px, 2.8vw, 54px)', height: 'clamp(38px, 2.8vw, 54px)', borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icons.Droplet size={20} stroke="#fff" sw={2} />
            </div>
            <div>
              <div style={{ fontSize: 'clamp(16px, 1.2vw, 23px)', fontWeight: 800, color: 'var(--sidebar-ink-hi)', lineHeight: 1 }}>AutoWash Pro</div>
              <div style={{ fontSize: 'clamp(10px, 0.68vw, 12px)', color: 'var(--sidebar-ink)', letterSpacing: '0.07em', marginTop: 4 }}>TÀI KHOẢN KHÁCH HÀNG</div>
            </div>
          </div>

          <div style={{ fontSize: 'clamp(34px, 3vw, 64px)', fontWeight: 800, color: 'var(--sidebar-ink-hi)', lineHeight: 1.08, marginBottom: 'clamp(14px, 1.2vw, 22px)' }}>
            Đặt lịch rửa xe<br />nhanh hơn
          </div>
          <div style={{ fontSize: 'clamp(14px, 0.95vw, 18px)', color: 'var(--sidebar-ink)', lineHeight: 1.65, maxWidth: 720, marginBottom: 'clamp(30px, 3vw, 54px)' }}>
            Đăng nhập để đặt lịch, lưu thông tin xe, theo dõi điểm thưởng và nhận ưu đãi dành riêng cho hạng thành viên của bạn.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'clamp(12px, 1vw, 18px)' }}>
            {CUSTOMER_FEATURES.map(([title, desc]) => (
              <div key={title} style={{ padding: 'clamp(14px, 1.2vw, 20px)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.045)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icons.Check size={13} stroke="#fff" sw={2.5} />
                </div>
                <div style={{ fontSize: 'clamp(13px, 0.9vw, 16px)', fontWeight: 800, color: 'var(--sidebar-ink-hi)', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 'clamp(11px, 0.72vw, 13px)', color: 'var(--sidebar-ink)', lineHeight: 1.55 }}>{desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'clamp(18px, 1.8vw, 32px)', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 12 }}>
            <div style={{ padding: 'clamp(14px, 1.2vw, 20px)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.20)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Quyền lợi thành viên</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  ['4', 'hạng'],
                  ['+20', 'điểm/lần'],
                  ['14 ngày', 'đặt trước'],
                ].map(([num, label]) => (
                  <div key={label}>
                    <div style={{ fontSize: 'clamp(17px, 1.45vw, 27px)', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Geist Mono',monospace" }}>{num}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.46)', marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: 'clamp(14px, 1.2vw, 20px)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.045)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Sau khi đăng nhập</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>
                <span><Icons.Calendar size={12} /> Đặt lịch mới</span>
                <span><Icons.Coins size={12} /> Xem điểm thưởng</span>
                <span><Icons.Bike size={12} /> Cập nhật xe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="aw-login-right" style={{
        width: 'clamp(420px, 30vw, 600px)',
        flexShrink: 0,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: 'clamp(44px, 4vw, 76px) clamp(40px, 3.6vw, 64px)',
      }}>
        <div className="aw-login-mobile-logo" style={{ alignItems: 'center', gap: 9, marginBottom: 'clamp(24px, 2.4vw, 36px)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={16} stroke="#fff" sw={2} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>AutoWash Pro</div>
            <div style={{ fontSize: 10, color: 'var(--ink-400)', letterSpacing: '0.06em' }}>TÀI KHOẢN KHÁCH HÀNG</div>
          </div>
        </div>

        <div style={{ fontSize: 'clamp(22px, 1.8vw, 34px)', fontWeight: 800, marginBottom: 5 }}>
          {tab === 'customer' ? 'Tài khoản khách hàng' : 'Đăng nhập nội bộ'}
        </div>
        <div style={{ fontSize: 'clamp(12px, 0.85vw, 15px)', color: 'var(--ink-500)', marginBottom: 'clamp(20px, 2vw, 32px)', lineHeight: 1.5 }}>
          {tab === 'customer'
            ? 'Đăng nhập bằng số điện thoại để đặt lịch và theo dõi điểm thưởng.'
            : 'Dành cho nhân viên và quản trị viên của tiệm.'}
        </div>

        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 9, background: 'var(--bg)', marginBottom: 'clamp(20px, 2vw, 32px)', border: '1px solid var(--border)' }}>
          <RoleTab active={tab === 'customer'} onClick={() => switchTab('customer')} icon={<Icons.User size={13} />}>Khách hàng</RoleTab>
          <RoleTab active={tab === 'system'} onClick={() => switchTab('system')} icon={<Icons.Users size={13} />}>Nội bộ</RoleTab>
        </div>

        {tab === 'system' ? (
          <form onSubmit={submitSystem} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Email">
              <input
                className="aw-input" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ height: 'clamp(38px, 3vw, 48px)', fontSize: 'clamp(13px, 0.9vw, 15px)' }} autoComplete="username"
                placeholder="admin@autowash.com" required
              />
            </FormField>
            <FormField label="Mật khẩu">
              <PassInput value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass((v) => !v)} />
            </FormField>
            {error && <ErrBox>{error}</ErrBox>}
            <button className="aw-btn aw-btn-primary" disabled={loading} style={btnStyle}>
              {loading ? 'Đang đăng nhập...' : <><span>Đăng nhập</span><Icons.ArrowRight size={15} /></>}
            </button>
            <div style={{ fontSize: 11, color: 'var(--ink-400)', textAlign: 'center', lineHeight: 1.5 }}>
              Dùng tài khoản do quản trị viên cấp.
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
              <ModeBtn active={mode === 'login'} onClick={() => switchMode('login')}>Đăng nhập</ModeBtn>
              <ModeBtn active={mode === 'register'} onClick={() => switchMode('register')}>Đăng ký mới</ModeBtn>
            </div>
            <form onSubmit={submitCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mode === 'register' && (
                <FormField label="Họ và tên">
                  <input
                    className="aw-input" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ height: 'clamp(38px, 3vw, 48px)', fontSize: 'clamp(13px, 0.9vw, 15px)' }} placeholder="Nguyễn Văn A" required
                  />
                </FormField>
              )}
              <FormField label="Số điện thoại">
                <input
                  className="aw-input" type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ height: 'clamp(38px, 3vw, 48px)', fontSize: 'clamp(13px, 0.9vw, 15px)', fontFamily: "'Geist Mono',monospace" }}
                  placeholder="0901234567" required
                />
              </FormField>
              <FormField label="Mật khẩu">
                <PassInput value={password} onChange={setPassword} show={showPass} onToggle={() => setShowPass((v) => !v)} />
              </FormField>
              {error && <ErrBox>{error}</ErrBox>}
              <button className="aw-btn aw-btn-primary" disabled={loading} style={btnStyle}>
                {loading
                  ? (mode === 'register' ? 'Đang đăng ký...' : 'Đang đăng nhập...')
                  : <><span>{mode === 'register' ? 'Tạo tài khoản' : 'Đăng nhập'}</span><Icons.ArrowRight size={15} /></>
                }
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: 'clamp(20px, 2.2vw, 36px)', paddingTop: 'clamp(16px, 1.6vw, 24px)', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 'clamp(10px, 0.68vw, 12px)', color: 'var(--ink-300)', lineHeight: 1.6 }}>
          © 2026 AutoWash Pro<br />
          <span style={{ color: 'var(--ink-400)' }}>Đặt lịch và tích điểm cho khách hàng thân thiết</span>
        </div>
      </div>
    </div>
  )
}

const btnStyle = { height: 'clamp(40px, 3.2vw, 52px)', width: '100%', fontSize: 'clamp(13px, 0.95vw, 16px)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }

function RoleTab({ active, onClick, icon, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontFamily: 'inherit', transition: 'all 0.12s',
      background: active ? 'var(--surface)' : 'transparent',
      color: active ? 'var(--ink-900)' : 'var(--ink-500)',
      boxShadow: active ? 'var(--shadow-xs)' : 'none',
    }}>{icon}{children}</button>
  )
}

function ModeBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, height: 36, border: 'none', background: 'transparent', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
      color: active ? 'var(--ink-900)' : 'var(--ink-500)',
      borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
      marginBottom: -1, paddingBottom: 2,
    }}>{children}</button>
  )
}

function FormField({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  )
}

function PassInput({ value, onChange, show, onToggle }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="aw-input" type={show ? 'text' : 'password'} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ height: 'clamp(38px, 3vw, 48px)', fontSize: 'clamp(13px, 0.9vw, 15px)', paddingRight: 42 }}
        autoComplete="current-password" required
      />
      <button type="button" onClick={onToggle} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        background: 'transparent', border: 0, color: 'var(--ink-400)', cursor: 'pointer', padding: 4,
      }}>
        <Icons.Eye size={15} />
      </button>
    </div>
  )
}

function ErrBox({ children }) {
  return (
    <div style={{
      fontSize: 12, color: 'var(--danger)', padding: '9px 12px', borderRadius: 6,
      background: 'var(--danger-soft)', border: '1px solid oklch(56% 0.20 25 / 18%)',
    }}>{children}</div>
  )
}
