// admin-screens.jsx v2 — Linear sidebar · Stripe tables · Shopify CRUD
// Rebuilt from scratch with new design language.

const { useState: useStateA } = React;

// ── Admin shell ─────────────────────────────────────────────────────────
function AdminShell({ active, title, subtitle, children, headerActions }) {
  const NAV = [
    { id: 'dashboard',  icon: 'Dashboard', label: 'Tổng quan',         group: 'main' },
    { id: 'services',   icon: 'Box',       label: 'Dịch vụ & giá',     group: 'main' },
    { id: 'promotions', icon: 'Tag',       label: 'Khuyến mãi',        group: 'main' },
    { id: 'tiers',      icon: 'Layers',    label: 'Hạng thành viên',   group: 'main' },
    { id: 'customers',  icon: 'Users',     label: 'Khách hàng',        group: 'main' },
    { id: 'reports',    icon: 'TrendUp',   label: 'Báo cáo',           group: 'main' },
    { id: 'settings',   icon: 'Settings',  label: 'Cài đặt',           group: 'bottom' },
  ];
  const main   = NAV.filter(n => n.group === 'main');
  const bottom = NAV.filter(n => n.group === 'bottom');

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'inherit' }}>
      {/* ── Dark sidebar (Linear-style) */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column',
        padding: '14px 10px',
      }}>
        {/* Wordmark */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '4px 8px 18px',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'var(--primary)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icons.Droplet size={14} stroke="#fff" sw={2}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sidebar-ink-hi)', lineHeight: 1 }}>AutoWash</div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', marginTop: 2, letterSpacing: '0.04em' }}>ADMIN</div>
          </div>
        </div>

        {/* Branch pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 8px', borderRadius: 6,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--sidebar-border)',
          marginBottom: 16, cursor: 'pointer',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }}/>
          <span style={{ fontSize: 12, color: 'var(--sidebar-ink-hi)', fontWeight: 500, flex: 1 }}>CN Quận 3</span>
          <Icons.ChevronRight size={12} stroke="var(--sidebar-ink)" style={{ transform: 'rotate(90deg)' }}/>
        </div>

        {/* Nav label */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sidebar-ink)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 6px' }}>
          Vận hành
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {main.map(it => {
            const Ic = Icons[it.icon];
            const isActive = it.id === active;
            return (
              <button key={it.id} className={`aw-nav-item${isActive ? ' active' : ''}`}>
                <Ic size={15} sw={isActive ? 2 : 1.7}/>
                {it.label}
              </button>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, borderTop: '1px solid var(--sidebar-border)', paddingTop: 10, marginTop: 10 }}>
          {bottom.map(it => {
            const Ic = Icons[it.icon];
            return (
              <button key={it.id} className="aw-nav-item">
                <Ic size={15}/>
                {it.label}
              </button>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 2px', marginTop: 4 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: 'oklch(45% 0.02 240)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
            }}>TM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--sidebar-ink-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Trần Minh</div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-ink)' }}>Quản lý chính</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>
        {/* Topbar */}
        <header style={{
          height: 52, flexShrink: 0,
          padding: '0 24px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
              {subtitle && <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>{subtitle}</span>}
            </div>
          </div>
          {/* Global search */}
          <div style={{ position: 'relative', width: 220 }}>
            <Icons.Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }}/>
            <input className="aw-input" placeholder="Tìm kiếm..." style={{ paddingLeft: 30, height: 30, fontSize: 12 }}/>
          </div>
          {headerActions}
        </header>

        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────
const Th = ({ children, w }) => (
  <th style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', width: w }}>{children}</th>
);
const Td = ({ children, mono }) => (
  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-900)', verticalAlign: 'middle', borderBottom: '1px solid var(--surface-3)', fontFamily: mono ? "'Geist Mono','JetBrains Mono',monospace" : 'inherit', fontWeight: mono ? 500 : 'inherit' }}>{children}</td>
);

function AdminLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 5 }}>{children}</div>;
}

function AdminInput({ ...props }) {
  return <input className="aw-input" {...props}/>;
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 36, height: 20, borderRadius: 10, padding: 2,
      background: on ? 'var(--green)' : 'var(--ink-300)',
      transition: 'background .15s', cursor: 'pointer', flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transform: `translateX(${on ? 16 : 0}px)`, transition: 'transform .15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}/>
    </div>
  );
}

function IconBtn({ children, danger, size = 'sm', title }) {
  return (
    <button title={title} style={{
      width: 28, height: 28, borderRadius: 6, padding: 0,
      background: 'transparent', border: '1px solid var(--border)',
      color: danger ? 'var(--danger)' : 'var(--ink-500)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'background .10s, color .10s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = danger ? 'var(--danger-soft)' : 'var(--surface-3)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
      {children}
    </button>
  );
}

function PageContainer({ children }) {
  return <div style={{ padding: 24, maxWidth: 1200 }}>{children}</div>;
}

function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
    </div>
  );
}

function AdminStatCard({ label, value, delta, positive, icon, accent }) {
  const Ic = Icons[icon];
  const accentColor = accent || 'var(--primary)';
  return (
    <div className="aw-card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 500 }}>{label}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: `color-mix(in oklab, ${accentColor} 10%, white)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ic size={14} stroke={accentColor}/>
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: "'Geist Mono','JetBrains Mono',monospace" }}>{value}</div>
      {delta && (
        <div style={{ marginTop: 6, fontSize: 12, color: positive ? 'var(--green-ink)' : 'var(--danger-ink)', fontWeight: 500 }}>
          {positive ? '↑' : '↓'} {delta} vs. tuần trước
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 1. ADMIN LOGIN
// ─────────────────────────────────────────────────────────────────────────
function AdminLogin() {
  const [showPw, setShowPw] = useStateA(false);

  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--bg)' }}>
      {/* Left: form */}
      <div style={{
        width: 440, flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 52px', background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={16} stroke="#fff" sw={2}/>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>AutoWash Pro</span>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Đăng nhập quản trị</div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 24 }}>Sử dụng tài khoản được cấp bởi hệ thống.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <AdminLabel>Email</AdminLabel>
            <AdminInput defaultValue="admin@autowash.vn" style={{ height: 40, fontSize: 14 }}/>
          </div>
          <div>
            <AdminLabel>Mật khẩu</AdminLabel>
            <div style={{ position: 'relative' }}>
              <AdminInput type={showPw ? 'text' : 'password'} defaultValue="••••••••••" style={{ height: 40, fontSize: 14, paddingRight: 40 }}/>
              <button onClick={() => setShowPw(!showPw)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 0, color: 'var(--ink-400)', cursor: 'pointer', padding: 4,
              }}><Icons.Eye size={15}/></button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--ink-700)' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}/>
              Ghi nhớ đăng nhập
            </label>
            <a style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>Quên mật khẩu?</a>
          </div>
          <button className="aw-btn aw-btn-primary" style={{ height: 40, width: '100%', fontSize: 14, fontWeight: 600 }}>
            Đăng nhập <Icons.ArrowRight size={14}/>
          </button>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 40, fontSize: 11, color: 'var(--ink-400)' }}>© 2026 AutoWash Pro · v2.4.0</div>
      </div>

      {/* Right: dark stats panel */}
      <div style={{ flex: 1, background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 52 }}>
        <div style={{ fontSize: 11, color: 'var(--sidebar-ink)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Tổng quan · Hôm nay
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--sidebar-ink-hi)', letterSpacing: '-0.02em', marginBottom: 36 }}>
          Xin chào, Trần Minh
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>
          {[
            { l: 'Doanh thu hôm nay',  v: '2.640.000₫', d: '+12%' },
            { l: 'Lượt rửa',           v: '42',          d: '+6' },
            { l: 'Đang xử lý',         v: '3',           d: '' },
            { l: 'Khách mới',          v: '7',           d: '' },
          ].map(s => (
            <div key={s.l} style={{ padding: '14px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--sidebar-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--sidebar-ink)', marginBottom: 8 }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--sidebar-ink-hi)', letterSpacing: '-0.02em', fontFamily: "'Geist Mono','JetBrains Mono',monospace" }}>{s.v}</div>
              {s.d && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>↑ {s.d}</div>}
            </div>
          ))}
        </div>

        {/* Spark chart */}
        <div style={{ padding: '16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sidebar-border)' }}>
          <div style={{ fontSize: 11, color: 'var(--sidebar-ink)', marginBottom: 12, fontWeight: 500 }}>DOANH THU 7 NGÀY GẦN NHẤT</div>
          <div style={{ height: 56, display: 'flex', alignItems: 'flex-end', gap: 5 }}>
            {[38, 55, 42, 70, 60, 82, 75].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0',
                background: i === 6 ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--sidebar-ink)' }}>
            {['T2','T3','T4','T5','T6','T7','CN'].map(d => <span key={d}>{d}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2. DASHBOARD
// ─────────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  return (
    <AdminShell active="dashboard" title="Tổng quan" subtitle="· 26/05/2026"
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="aw-input" style={{ width: 'auto', height: 30, padding: '0 10px', fontSize: 12 }}>
            <option>7 ngày</option><option>30 ngày</option><option>3 tháng</option>
          </select>
          <button className="aw-btn aw-btn-ghost aw-btn-sm"><Icons.Receipt size={13}/> Xuất</button>
        </div>
      }
    >
      <PageContainer>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <AdminStatCard label="Doanh thu 7 ngày"  value="18.42tr ₫" delta="12.4%" positive icon="Wallet"   accent="var(--primary)"/>
          <AdminStatCard label="Lượt rửa"           value="284"       delta="18.2%" positive icon="Sparkles" accent="var(--green)"/>
          <AdminStatCard label="Khách mới"          value="32"        delta="4"     positive icon="Users"    accent="var(--gold)"/>
          <AdminStatCard label="Trung bình / đơn"   value="64.8K ₫"  delta="2.1%"           icon="Receipt"  accent="var(--ink-500)"/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Chart card */}
          <div className="aw-card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Doanh thu theo ngày</div>
                <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>Tuần này vs. tuần trước</div>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-500)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 3, borderRadius: 2, background: 'var(--primary)', display: 'inline-block' }}/> Tuần này
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 3, borderRadius: 2, background: 'var(--ink-300)', display: 'inline-block' }}/> Tuần trước
                </span>
              </div>
            </div>
            <div style={{ padding: '20px 18px' }}>
              <RevenueChart/>
            </div>
          </div>

          {/* Services donut */}
          <div className="aw-card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Dịch vụ phổ biến</div>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>7 ngày qua</div>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Rửa kỹ + Lau bóng',      pct: 38, color: 'var(--primary)' },
                { name: 'Rửa cơ bản',              pct: 26, color: 'var(--green)' },
                { name: 'Combo Toàn Phần',         pct: 18, color: 'var(--gold)' },
                { name: 'Rửa máy chuyên sâu',      pct: 12, color: 'oklch(60% 0.13 280)' },
                { name: 'Đánh bóng nhựa',          pct: 6,  color: 'var(--ink-300)' },
              ].map(s => (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--ink-700)' }}>
                    <span>{s.name}</span>
                    <span style={{ fontWeight: 600, fontFamily: "'Geist Mono',monospace" }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct * 2.3}%`, height: '100%', background: s.color, borderRadius: 2 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent bookings table */}
        <div className="aw-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Đơn gần đây</div>
            <button className="aw-btn aw-btn-ghost aw-btn-sm">Xem tất cả →</button>
          </div>
          <table className="aw-table">
            <thead>
              <tr><Th>Mã</Th><Th>Khách hàng</Th><Th>Dịch vụ</Th><Th>Giờ</Th><Th>Tổng</Th><Th>Trạng thái</Th></tr>
            </thead>
            <tbody>
              {TODAY_BOOKINGS.map((b, i) => (
                <tr key={b.id}>
                  <Td mono>{b.id}</Td>
                  <Td>
                    <div style={{ fontWeight: 500 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace" }}>{b.plate}</div>
                  </Td>
                  <Td><span style={{ color: 'var(--ink-700)' }}>{b.service}</span></Td>
                  <Td mono>{b.time}</Td>
                  <Td><span style={{ fontWeight: 600, fontFamily: "'Geist Mono',monospace" }}>{formatVND(b.price)}</span></Td>
                  <Td><AdminStatusBadge status={i === 0 ? 'in-progress' : i < 2 ? 'queued' : 'completed'}/></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageContainer>
    </AdminShell>
  );
}

function RevenueChart() {
  const bars = [
    { d:'T2', cur:60, prev:50 }, { d:'T3', cur:75, prev:60 },
    { d:'T4', cur:55, prev:70 }, { d:'T5', cur:80, prev:65 },
    { d:'T6', cur:70, prev:75 }, { d:'T7', cur:95, prev:80 }, { d:'CN', cur:88, prev:72 },
  ];
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
      {bars.map(b => (
        <div key={b.d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            <div style={{ flex: 1, height: `${b.prev}%`, background: 'var(--surface-3)', borderRadius: '3px 3px 0 0' }}/>
            <div style={{ flex: 1, height: `${b.cur}%`, background: 'var(--primary)', borderRadius: '3px 3px 0 0', opacity: b.d === 'CN' ? 1 : 0.8 }}/>
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-400)', letterSpacing: '0.04em' }}>{b.d}</div>
        </div>
      ))}
    </div>
  );
}

function AdminStatusBadge({ status }) {
  const map = {
    'in-progress': { label: 'Đang rửa',  cls: 'aw-badge aw-badge-amber' },
    queued:        { label: 'Đang chờ',  cls: 'aw-badge aw-badge-neutral' },
    completed:     { label: 'Hoàn tất',  cls: 'aw-badge aw-badge-green' },
    active:        { label: 'Đang chạy', cls: 'aw-badge aw-badge-green' },
    expired:       { label: 'Hết hạn',   cls: 'aw-badge aw-badge-neutral' },
    upcoming:      { label: 'Sắp tới',   cls: 'aw-badge aw-badge-blue' },
  };
  const s = map[status] || map.queued;
  return <span className={s.cls}><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}/>{s.label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. SERVICES & PRICING
// ─────────────────────────────────────────────────────────────────────────
function AdminServices() {
  const [sel, setSel] = useStateA('s2');
  const [toggles, setToggles] = useStateA({ s1:true,s2:true,s3:true,s4:false,s5:true });
  const svc = SERVICES.find(s => s.id === sel);

  return (
    <AdminShell active="services" title="Dịch vụ & Giá"
      headerActions={
        <button className="aw-btn aw-btn-primary aw-btn-sm"><Icons.Plus size={13} sw={2.5}/> Thêm dịch vụ</button>
      }
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Table panel */}
        <div style={{ flex: 1, padding: 24, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Icons.Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }}/>
              <input className="aw-input" placeholder="Tìm dịch vụ..." style={{ paddingLeft: 30, height: 32, fontSize: 12 }}/>
            </div>
            <button className="aw-btn aw-btn-ghost aw-btn-sm"><Icons.Filter size={13}/> Lọc</button>
          </div>

          <div className="aw-card" style={{ overflow: 'hidden' }}>
            <table className="aw-table">
              <thead>
                <tr><Th>Dịch vụ</Th><Th>Mô tả</Th><Th>Thời gian</Th><Th>Giá</Th><Th>Hiển thị</Th><Th></Th></tr>
              </thead>
              <tbody>
                {SERVICES.map(s => (
                  <tr key={s.id} onClick={() => setSel(s.id)} style={{ background: sel === s.id ? 'var(--primary-soft)' : 'transparent' }}>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                          background: 'var(--primary-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Icons.Droplet size={14} stroke="var(--primary-ink)"/></div>
                        <div>
                          <span style={{ fontWeight: 600 }}>{s.name}</span>
                          {s.popular && <span className="aw-badge aw-badge-amber" style={{ marginLeft: 8, fontSize: 10 }}>Phổ biến</span>}
                        </div>
                      </div>
                    </Td>
                    <Td><span style={{ color: 'var(--ink-500)', fontSize: 12 }}>{s.desc}</span></Td>
                    <Td mono>{s.time} ph</Td>
                    <Td><span style={{ fontWeight: 700, fontFamily: "'Geist Mono',monospace" }}>{formatVND(s.price)}</span></Td>
                    <Td>
                      <Toggle on={toggles[s.id]} onChange={() => setToggles(t => ({ ...t, [s.id]: !t[s.id] }))}/>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <IconBtn title="Sửa"><Icons.Edit size={13}/></IconBtn>
                        <IconBtn title="Xoá" danger><Icons.Trash size={13}/></IconBtn>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit panel */}
        <aside style={{
          width: 340, flexShrink: 0,
          background: 'var(--surface)', borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Chỉnh sửa</span>
            <button style={{ background: 'transparent', border: 0, color: 'var(--ink-400)', cursor: 'pointer', padding: 2 }}><Icons.X size={14}/></button>
          </div>
          <div className="aw-scroll" style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="aw-photo" style={{ height: 100 }}>// ICON / ẢNH DỊCH VỤ</div>
            <div>
              <AdminLabel>Tên dịch vụ</AdminLabel>
              <AdminInput defaultValue={svc.name} key={svc.id}/>
            </div>
            <div>
              <AdminLabel>Mô tả ngắn</AdminLabel>
              <AdminInput defaultValue={svc.desc} key={svc.id + '_d'}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <AdminLabel>Giá (₫)</AdminLabel>
                <AdminInput defaultValue={svc.price.toLocaleString('vi-VN')} key={svc.id + '_p'}/>
              </div>
              <div>
                <AdminLabel>Thời gian (ph)</AdminLabel>
                <AdminInput defaultValue={svc.time} key={svc.id + '_t'}/>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <AdminLabel>Hiển thị cho khách</AdminLabel>
              <Toggle on={toggles[svc.id]} onChange={() => setToggles(t => ({ ...t, [svc.id]: !t[svc.id] }))}/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <AdminLabel>Đánh dấu "Phổ biến"</AdminLabel>
              <Toggle on={svc.popular}/>
            </div>
            <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.5 }}>
              Điểm tích lũy tính theo hạng thành viên. <a style={{ color: 'var(--primary)' }}>Xem cấu hình →</a>
            </div>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <button className="aw-btn aw-btn-ghost" style={{ flex: 1, height: 34 }}>Huỷ</button>
            <button className="aw-btn aw-btn-primary" style={{ flex: 2, height: 34, fontSize: 13 }}>Lưu thay đổi</button>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 4. PROMOTIONS
// ─────────────────────────────────────────────────────────────────────────
function AdminPromotions() {
  return (
    <AdminShell active="promotions" title="Khuyến mãi"
      headerActions={
        <button className="aw-btn aw-btn-primary aw-btn-sm"><Icons.Plus size={13} sw={2.5}/> Tạo khuyến mãi</button>
      }
    >
      <PageContainer>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          <AdminStatCard label="Đang chạy"      value="3"      delta="1" positive icon="Tag"     accent="var(--green)"/>
          <AdminStatCard label="Lượt sử dụng"   value="709"    delta="182" positive icon="Users" accent="var(--primary)"/>
          <AdminStatCard label="Tiết kiệm áp dụng" value="−4.2tr" icon="Wallet" accent="var(--gold)"/>
          <AdminStatCard label="Chuyển đổi"     value="14.2%"  delta="2.4%" positive icon="TrendUp" accent="var(--ink-500)"/>
        </div>

        <SectionDivider label="Đang hoạt động"/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {PROMOTIONS.filter(p => p.status === 'active').map((p, i) => {
            const colors = ['var(--green)', 'var(--primary)', 'var(--gold)'];
            const c = colors[i % 3];
            return (
              <div key={p.id} className="aw-card" style={{ overflow: 'hidden' }}>
                <div style={{
                  padding: '14px 16px',
                  background: `color-mix(in oklab, ${c} 8%, white)`,
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                }}>
                  <div>
                    <span className="aw-badge aw-badge-green" style={{ marginBottom: 8, display: 'inline-flex' }}>Đang chạy</span>
                    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>{p.discount}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', marginTop: 2 }}>{p.title}</div>
                  </div>
                  <code style={{
                    padding: '4px 8px', borderRadius: 5,
                    background: `color-mix(in oklab, ${c} 15%, white)`,
                    border: `1px solid color-mix(in oklab, ${c} 25%, white)`,
                    fontSize: 11, fontFamily: "'Geist Mono',monospace", fontWeight: 600, color: 'var(--ink-900)',
                  }}>{p.code}</code>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: 'var(--ink-500)' }}>
                    <span>Sử dụng</span>
                    <span style={{ fontWeight: 600, color: 'var(--ink-900)', fontFamily: "'Geist Mono',monospace" }}>{p.uses} / {p.max}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${(p.uses/p.max)*100}%`, height: '100%', background: c, borderRadius: 2 }}/>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-500)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{p.start} → {p.end}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <IconBtn><Icons.Edit size={12}/></IconBtn>
                      <IconBtn danger><Icons.Trash size={12}/></IconBtn>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="aw-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Tất cả khuyến mãi</span>
          </div>
          <table className="aw-table">
            <thead>
              <tr><Th>Mã</Th><Th>Tên</Th><Th>Giảm</Th><Th>Thời hạn</Th><Th>Đã dùng</Th><Th>Trạng thái</Th><Th></Th></tr>
            </thead>
            <tbody>
              {PROMOTIONS.map(p => (
                <tr key={p.id}>
                  <Td mono>{p.code}</Td>
                  <Td><span style={{ fontWeight: 500 }}>{p.title}</span></Td>
                  <Td><span style={{ fontWeight: 700, fontFamily: "'Geist Mono',monospace" }}>{p.discount}</span></Td>
                  <Td><span style={{ color: 'var(--ink-500)', fontSize: 12 }}>{p.start} → {p.end}</span></Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'Geist Mono',monospace", fontWeight: 600 }}>{p.uses}</span>
                      <div style={{ width: 48, height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(p.uses/p.max)*100}%`, height: '100%', background: 'var(--primary)' }}/>
                      </div>
                      <span style={{ color: 'var(--ink-400)', fontSize: 11 }}>/{p.max}</span>
                    </div>
                  </Td>
                  <Td><AdminStatusBadge status={p.status}/></Td>
                  <Td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <IconBtn><Icons.Edit size={13}/></IconBtn>
                      <IconBtn danger><Icons.Trash size={13}/></IconBtn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageContainer>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 5. TIER CONFIG
// ─────────────────────────────────────────────────────────────────────────
function AdminTiers() {
  return (
    <AdminShell active="tiers" title="Cấu hình hạng thành viên"
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="aw-btn aw-btn-ghost aw-btn-sm">Huỷ</button>
          <button className="aw-btn aw-btn-primary aw-btn-sm">Lưu cấu hình</button>
        </div>
      }
    >
      <PageContainer>
        {/* Conversion rule */}
        <div className="aw-card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icons.Coins size={18} stroke="var(--primary-ink)"/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Quy tắc quy đổi điểm</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>Mỗi <b>1.000₫</b> thanh toán = <b>1 điểm</b> (sau khuyến mãi)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AdminInput defaultValue="1000" style={{ width: 90 }}/>
            <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>₫ =</span>
            <AdminInput defaultValue="1" style={{ width: 70 }}/>
            <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>điểm</span>
          </div>
        </div>

        {/* Tier cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {TIERS.map((t, i) => (
            <div key={t.id} className="aw-card" style={{ overflow: 'hidden' }}>
              {/* Header band */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: `color-mix(in oklab, ${t.color} 8%, white)`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hạng {i + 1}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{t.name}</div>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icons.Star size={15} stroke="#fff" sw={2}/>
                </div>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <AdminLabel>Ngưỡng điểm</AdminLabel>
                  <div style={{ position: 'relative' }}>
                    <AdminInput defaultValue={t.min}/>
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-400)' }}>điểm</span>
                  </div>
                </div>
                <div>
                  <AdminLabel>Hệ số tích điểm</AdminLabel>
                  <AdminInput defaultValue={t.bonus}/>
                </div>
                <div>
                  <AdminLabel>Quyền lợi</AdminLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                    {['Tích điểm tự động', i >= 1 && 'Ưu đãi sinh nhật', i >= 2 && 'Đặt lịch ưu tiên', i >= 3 && 'Rửa miễn phí / tháng'].filter(Boolean).map(b => (
                      <span key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-700)' }}>
                        <Icons.Check size={12} stroke="var(--green-ink)" sw={2.5}/>{b}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-500)' }}>
                  <b style={{ color: 'var(--ink-900)', fontFamily: "'Geist Mono',monospace" }}>{[578,385,231,90][i]}</b> khách hiện tại
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live preview bar */}
        <div className="aw-card" style={{ padding: '16px 24px', marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Xem trước tiến độ thang điểm</div>
          <div style={{ position: 'relative', padding: '10px 0 28px' }}>
            <div style={{ position: 'absolute', left: 12, right: 12, top: '50%', height: 3, background: 'var(--surface-3)', borderRadius: 2, transform: 'translateY(-100%)' }}/>
            <div style={{ position: 'absolute', left: 12, top: '50%', height: 3, width: '50%', background: `linear-gradient(90deg, var(--tier-dong), var(--tier-bac), var(--tier-vang))`, borderRadius: 2, transform: 'translateY(-100%)' }}/>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
              {TIERS.map((t, i) => (
                <div key={t.id} style={{ textAlign: 'center', width: 80 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', margin: '0 auto',
                    background: i < 3 ? t.color : 'var(--surface)',
                    border: `2px solid ${i < 3 ? t.color : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11,
                  }}>{i < 3 && <Icons.Check size={11} sw={3}/>}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginTop: 8 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-400)' }}>{t.min === 0 ? 'Mặc định' : `${t.min}đ`}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </AdminShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 6. CUSTOMERS
// ─────────────────────────────────────────────────────────────────────────
function AdminCustomers() {
  const [sel, setSel] = useStateA(0);
  const c = CUSTOMERS_LIST[sel];
  const [manualTier, setManualTier] = useStateA(c.tier);

  React.useEffect(() => { setManualTier(CUSTOMERS_LIST[sel].tier); }, [sel]);

  return (
    <AdminShell active="customers" title="Khách hàng" subtitle="· 1.284 thành viên"
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="aw-btn aw-btn-ghost aw-btn-sm"><Icons.Receipt size={13}/> CSV</button>
          <button className="aw-btn aw-btn-primary aw-btn-sm"><Icons.Plus size={13} sw={2.5}/> Thêm khách</button>
        </div>
      }
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Table */}
        <div style={{ flex: 1, padding: 24, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Icons.Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }}/>
              <input className="aw-input" placeholder="Tên hoặc số điện thoại..." style={{ paddingLeft: 30, height: 32, fontSize: 12 }}/>
            </div>
            <select className="aw-input" style={{ width: 'auto', height: 32, padding: '0 10px', fontSize: 12 }}>
              <option>Tất cả hạng</option>
              {TIERS.map(t => <option key={t.id}>{t.name}</option>)}
            </select>
            <button className="aw-btn aw-btn-ghost aw-btn-sm"><Icons.Filter size={13}/> Lọc</button>
          </div>

          <div className="aw-card" style={{ overflow: 'hidden' }}>
            <table className="aw-table">
              <thead>
                <tr>
                  <Th w={28}><input type="checkbox" style={{ width: 13, height: 13 }}/></Th>
                  <Th>Khách hàng</Th><Th>SĐT</Th><Th>Hạng</Th><Th>Điểm</Th><Th>Lượt</Th><Th>Đã chi</Th><Th></Th>
                </tr>
              </thead>
              <tbody>
                {CUSTOMERS_LIST.map((cust, i) => (
                  <tr key={i} onClick={() => setSel(i)} style={{ background: sel === i ? 'var(--primary-soft)' : 'transparent' }}>
                    <Td><input type="checkbox" style={{ width: 13, height: 13 }}/></Td>
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'oklch(94% 0.025 210)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, color: 'var(--primary-ink)',
                        }}>{cust.name.split(' ').slice(-2).map(p => p[0]).join('')}</div>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{cust.name}</span>
                      </div>
                    </Td>
                    <Td mono>{cust.phone}</Td>
                    <Td><TierBadge tier={cust.tier} size="sm"/></Td>
                    <Td mono>{cust.points.toLocaleString('vi-VN')}</Td>
                    <Td mono>{cust.visits}</Td>
                    <Td><span style={{ fontFamily: "'Geist Mono',monospace", fontWeight: 600 }}>{formatVND(cust.spent)}</span></Td>
                    <Td><IconBtn><Icons.MoreVert size={13}/></IconBtn></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <aside style={{
          width: 320, flexShrink: 0, background: 'var(--surface)',
          borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: 'oklch(94% 0.025 210)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: 'var(--primary-ink)',
            }}>{c.name.split(' ').slice(-2).map(p => p[0]).join('')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 1 }}>{c.phone}</div>
              <div style={{ marginTop: 4 }}><TierBadge tier={c.tier} size="sm"/></div>
            </div>
          </div>

          <div className="aw-scroll" style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[
                { l: 'Điểm', v: c.points.toLocaleString('vi-VN') },
                { l: 'Lượt', v: c.visits },
                { l: 'Chi', v: formatVNDShort(c.spent) },
              ].map(s => (
                <div key={s.l} style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Geist Mono',monospace" }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Manual tier */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>Đổi hạng thủ công</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {TIERS.map(t => (
                  <button key={t.id} onClick={() => setManualTier(t.id)} style={{
                    padding: '7px 10px', borderRadius: 6,
                    border: '1px solid', cursor: 'pointer',
                    borderColor: manualTier === t.id ? t.color : 'var(--border)',
                    background: manualTier === t.id ? `color-mix(in oklab, ${t.color} 8%, white)` : 'var(--surface)',
                    color: manualTier === t.id ? t.color : 'var(--ink-700)',
                    fontSize: 12, fontWeight: manualTier === t.id ? 700 : 500,
                    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color }}/>
                    {t.name}
                  </button>
                ))}
              </div>
              {manualTier !== c.tier && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-500)', padding: 8, background: 'var(--warning-soft)', borderRadius: 5, border: '1px solid oklch(90% 0.08 80)' }}>
                  Thay đổi chưa lưu — hạng thủ công sẽ duy trì đến kỳ đánh giá kế.
                </div>
              )}
            </div>

            {/* Adjust points */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>Điều chỉnh điểm</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <AdminInput placeholder="Số điểm..." style={{ flex: 1 }}/>
                <button className="aw-btn aw-btn-ghost aw-btn-sm">−</button>
                <button className="aw-btn aw-btn-green aw-btn-sm">+</button>
              </div>
            </div>

            {/* History */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>Lịch sử gần đây</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {MY_BOOKINGS.slice(0, 4).map((b, i) => (
                  <div key={b.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--surface-3)' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{b.service}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 1 }}>{b.date}</div>
                    </div>
                    <span style={{ fontFamily: "'Geist Mono',monospace", fontWeight: 600, fontSize: 12 }}>{formatVND(b.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <button className="aw-btn aw-btn-ghost" style={{ flex: 1, height: 32, fontSize: 12 }}>Huỷ</button>
            <button className="aw-btn aw-btn-primary" style={{ flex: 2, height: 32, fontSize: 12 }}>Lưu thay đổi</button>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

Object.assign(window, {
  AdminLogin, AdminDashboard, AdminServices, AdminPromotions, AdminTiers, AdminCustomers,
  AdminStatusBadge,
});
