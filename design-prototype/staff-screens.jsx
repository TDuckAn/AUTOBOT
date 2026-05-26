// staff-screens.jsx v2 — High-contrast POS aesthetic
// Login · Booking Queue (interactive) · Walk-in Booking

const { useState: useStateS } = React;

// ── Staff shell ──────────────────────────────────────────────────────────
function StaffShell({ active, onChange, children, title, headerRight }) {
  const items = [
    { id: 'queue',   icon: 'Calendar', label: 'Hàng chờ',     badge: '6' },
    { id: 'walkin',  icon: 'Plus',     label: 'Khách vãng lai' },
    { id: 'history', icon: 'Receipt',  label: 'Lịch sử' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg)' }}>
      {/* Dark sidebar */}
      <aside style={{
        width: 200, flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column',
        padding: '14px 10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 20px' }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={14} stroke="#fff" sw={2}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sidebar-ink-hi)', lineHeight: 1 }}>AutoWash</div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', marginTop: 2, letterSpacing: '0.04em' }}>NHÂN VIÊN</div>
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sidebar-ink)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 6px' }}>
          Hôm nay
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {items.map(it => {
            const Ic = Icons[it.icon];
            const isActive = it.id === active;
            return (
              <button key={it.id} onClick={() => onChange?.(it.id)} className={`aw-nav-item${isActive ? ' active' : ''}`} style={{ justifyContent: 'flex-start', position: 'relative' }}>
                <Ic size={15} sw={isActive ? 2 : 1.7}/>
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.badge && (
                  <span style={{
                    minWidth: 18, height: 18, borderRadius: 9,
                    background: 'var(--primary)', color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '0 5px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Geist Mono',monospace",
                  }}>{it.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Ca / staff info */}
        <div style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sidebar-border)' }}>
            <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', marginBottom: 2 }}>Ca sáng · 07:00 – 15:00</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sidebar-ink-hi)', fontFamily: "'Geist Mono',monospace" }}>07:24 còn lại</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'oklch(45% 0.02 240)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>HT</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--sidebar-ink-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Hoàng Tâm</div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-ink)' }}>CN Quận 3</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: 52, flexShrink: 0, padding: '0 22px',
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Thứ Tư · 26/05/2026 · 09:42</span>
          </div>
          {headerRight}
        </header>
        <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────
function StField({ label, icon, children }) {
  const Ic = icon ? Icons[icon] : null;
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 5 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        {Ic && <Ic size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)', zIndex: 1 }}/>}
        {React.cloneElement(children, { style: { ...(children.props.style || {}), ...(Ic ? { paddingLeft: 32 } : {}) } })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 1. STAFF LOGIN
// ─────────────────────────────────────────────────────────────────────────
function StaffLogin() {
  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--bg)' }}>
      {/* Dark left panel */}
      <div style={{ flex: 1, background: 'var(--sidebar-bg)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', right: -120, top: -120, width: 360, height: 360, borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in oklab, var(--primary) 25%, transparent), transparent 70%)`,
          pointerEvents: 'none',
        }}/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Droplet size={15} stroke="#fff" sw={2}/>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--sidebar-ink-hi)' }}>AutoWash Pro</span>
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--sidebar-ink)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Cổng nhân viên</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--sidebar-ink-hi)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 32 }}>
          Bắt đầu<br/>ca làm việc
        </div>

        {/* Live stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 36 }}>
          {[
            { l: 'Hàng chờ', v: '6', accent: 'var(--primary)' },
            { l: 'Đang rửa', v: '1', accent: 'var(--gold)' },
            { l: 'Hoàn tất', v: '4', accent: 'var(--green)' },
          ].map(s => (
            <div key={s.l} style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--sidebar-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--sidebar-ink)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.l}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.accent, fontFamily: "'Geist Mono',monospace" }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--sidebar-ink)' }}>© 2026 AutoWash Pro · v2.4.0</div>
      </div>

      {/* White login form */}
      <div style={{ width: 400, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Đăng nhập nhân viên</div>
        <div style={{ fontSize: 13, color: 'var(--ink-500)', marginBottom: 24 }}>Dùng email được cấp bởi quản lý ca.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <StField label="Email" icon="User">
            <input className="aw-input" defaultValue="ht.staff@autowash.vn" style={{ height: 40, fontSize: 14 }}/>
          </StField>
          <StField label="Mật khẩu" icon="Lock">
            <input className="aw-input" type="password" defaultValue="••••••••" style={{ height: 40, fontSize: 14 }}/>
          </StField>
          <button className="aw-btn aw-btn-primary" style={{ height: 40, width: '100%', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
            Bắt đầu ca <Icons.ArrowRight size={14}/>
          </button>
        </div>

        <div style={{ marginTop: 20, padding: 12, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-500)', lineHeight: 1.5 }}>
          Quên mật khẩu? Liên hệ quản lý ca để được hỗ trợ.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2. BOOKING QUEUE
// ─────────────────────────────────────────────────────────────────────────
function StaffQueue() {
  const [done, setDone] = useStateS(new Set());
  const [selected, setSelected] = useStateS(TODAY_BOOKINGS[0].id);

  const selBooking = TODAY_BOOKINGS.find(b => b.id === selected);
  const revenue = [...done].reduce((s, id) => s + (TODAY_BOOKINGS.find(b => b.id === id)?.price || 0), 0);

  return (
    <StaffShell active="queue" title="Hàng chờ hôm nay"
      headerRight={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="aw-btn aw-btn-ghost aw-btn-sm"><Icons.Filter size={13}/> Lọc</button>
          <button className="aw-btn aw-btn-primary aw-btn-sm"><Icons.Plus size={13} sw={2.5}/> Thêm</button>
        </div>
      }
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Queue list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {[
              { l: 'Tổng',     v: TODAY_BOOKINGS.length, accent: 'var(--ink-900)' },
              { l: 'Đang rửa', v: 1,                      accent: 'var(--gold)' },
              { l: 'Hoàn tất', v: done.size,              accent: 'var(--green)' },
              { l: 'Doanh thu',v: formatVNDShort(revenue) + (revenue ? '₫' : '—'), accent: 'var(--primary)' },
            ].map(s => (
              <div key={s.l} style={{ padding: '12px 18px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.accent, fontFamily: "'Geist Mono',monospace", letterSpacing: '-0.02em' }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="aw-scroll" style={{ flex: 1 }}>
            {TODAY_BOOKINGS.map((b, i) => {
              const isDone = done.has(b.id);
              const isInProgress = i === 0 && !isDone;
              const isSel = selected === b.id;

              return (
                <div key={b.id} onClick={() => setSelected(b.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  borderBottom: '1px solid var(--border)',
                  background: isSel ? 'var(--primary-soft)' : isDone ? 'oklch(98% 0.01 158)' : 'var(--surface)',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${isInProgress ? 'var(--gold)' : isDone ? 'var(--green)' : isSel ? 'var(--primary)' : 'transparent'}`,
                  opacity: isDone ? 0.65 : 1,
                  transition: 'background .10s',
                }}>
                  {/* Time slot */}
                  <div style={{
                    width: 68, flexShrink: 0, padding: '16px 12px',
                    textAlign: 'center',
                    borderRight: '1px solid var(--border)',
                    background: isInProgress ? 'var(--gold)' : 'transparent',
                  }}>
                    <div style={{
                      fontSize: 15, fontWeight: 800, lineHeight: 1,
                      fontFamily: "'Geist Mono',monospace",
                      color: isInProgress ? '#fff' : 'var(--ink-900)',
                    }}>{b.time}</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none', color: 'var(--ink-900)' }}>{b.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-400)', fontFamily: "'Geist Mono',monospace" }}>{b.id}</span>
                      {isInProgress && <span className="aw-badge aw-badge-amber"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}/>Đang rửa</span>}
                      {isDone && <span className="aw-badge aw-badge-green"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}/>Hoàn tất</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 500 }}>{b.service}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 3, fontFamily: "'Geist Mono',monospace" }}>{b.plate}</div>
                  </div>

                  {/* Price + action */}
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(b.price)}</div>
                    {isDone ? (
                      <button onClick={e => { e.stopPropagation(); setDone(s => { const n = new Set(s); n.delete(b.id); return n; }); }}
                        style={{ fontSize: 11, color: 'var(--ink-400)', background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>
                        Hoàn tác
                      </button>
                    ) : (
                      <button className="aw-btn aw-btn-green aw-btn-sm" onClick={e => { e.stopPropagation(); setDone(s => new Set([...s, b.id])); }}>
                        <Icons.Check size={12} sw={2.5}/> Hoàn tất
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail / checkout panel */}
        <aside style={{
          width: 300, flexShrink: 0,
          background: 'var(--surface)', borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Đơn đang chọn</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{selBooking.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 1 }}>{selBooking.id} · {selBooking.time}</div>
          </div>

          <div className="aw-scroll" style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="aw-photo" style={{ height: 120 }}>// HONDA VISION · {selBooking.plate}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {[
                { l: 'Dịch vụ', v: selBooking.service },
                { l: 'Biển số', v: selBooking.plate, mono: true },
                { l: 'Giờ vào', v: selBooking.time },
                { l: 'Dự kiến', v: '25 phút' },
              ].map((r, i, arr) => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderBottom: i < arr.length - 1 ? '1px solid var(--surface-3)' : 'none', background: 'var(--surface)', fontSize: 12 }}>
                  <span style={{ color: 'var(--ink-500)' }}>{r.l}</span>
                  <span style={{ fontWeight: 600, fontFamily: r.mono ? "'Geist Mono',monospace" : 'inherit' }}>{r.v}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '10px 12px', borderRadius: 6, background: 'var(--primary-soft)', border: '1px solid oklch(90% 0.04 210)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <TierBadge tier="vang" size="sm"/>
                <span style={{ fontSize: 11, color: 'var(--ink-700)', fontWeight: 500 }}>Thành viên Vàng</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-700)' }}>Tự động cộng <b>+{Math.round(selBooking.price / 1000 * 1.5)} điểm</b> sau hoàn tất</div>
            </div>
          </div>

          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Tổng thanh toán</span>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(selBooking.price)}</span>
            </div>
            <button className="aw-btn aw-btn-green" style={{ width: '100%', height: 40, fontSize: 14, fontWeight: 600 }}
              onClick={() => setDone(s => new Set([...s, selBooking.id]))}>
              <Icons.Check size={15} sw={2.5}/> Hoàn tất & Thu tiền
            </button>
            <button className="aw-btn aw-btn-ghost aw-btn-sm" style={{ width: '100%' }}>Liên hệ khách hàng</button>
          </div>
        </aside>
      </div>
    </StaffShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3. WALK-IN BOOKING
// ─────────────────────────────────────────────────────────────────────────
function StaffWalkin() {
  const [selectedSvcs, setSelectedSvcs] = useStateS(new Set(['s2']));
  const [foundCustomer, setFoundCustomer] = useStateS(true);
  const [phone, setPhone] = useStateS('0912 345 678');

  const total = SERVICES.filter(s => selectedSvcs.has(s.id)).reduce((a, s) => a + s.price, 0);
  const totalTime = SERVICES.filter(s => selectedSvcs.has(s.id)).reduce((a, s) => a + s.time, 0);
  const points = Math.round(total / 1000 * 1.2);

  const toggle = id => setSelectedSvcs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <StaffShell active="walkin" title="Khách vãng lai">
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Left: form */}
        <div className="aw-scroll" style={{ flex: 1, padding: '20px 22px' }}>

          {/* Customer lookup */}
          <StepHeader n="1" title="Khách hàng" sub="Tra cứu SĐT hoặc nhập mới"/>
          <div className="aw-card" style={{ padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: foundCustomer ? 12 : 0 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Icons.Phone size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }}/>
                <input className="aw-input" value={phone} onChange={e => setPhone(e.target.value)} style={{ paddingLeft: 30 }} placeholder="Số điện thoại..."/>
              </div>
              <button className="aw-btn aw-btn-ghost" style={{ height: 36 }} onClick={() => setFoundCustomer(true)}>
                <Icons.Search size={13}/> Tìm
              </button>
              <button className="aw-btn aw-btn-outline" style={{ height: 36, fontSize: 12 }} onClick={() => setFoundCustomer(false)}>
                Nhập mới
              </button>
            </div>

            {foundCustomer ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 6,
                background: 'var(--green-soft)', border: '1px solid oklch(88% 0.09 158)',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'oklch(88% 0.09 158)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--green-ink)', flexShrink: 0 }}>LP</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Lê Hoàng Phúc</span>
                    <TierBadge tier="bac" size="sm"/>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 1 }}>0912 345 678 · 11 lần · 720đ</div>
                </div>
                <button className="aw-btn aw-btn-ghost aw-btn-sm" onClick={() => setFoundCustomer(false)}>Đổi</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <StField label="Họ tên"><input className="aw-input" placeholder="Nguyễn Văn A..."/></StField>
                <StField label="Biển số xe"><input className="aw-input" placeholder="59A1-000.00" style={{ fontFamily: "'Geist Mono',monospace" }}/></StField>
              </div>
            )}
          </div>

          {/* Vehicle */}
          <StepHeader n="2" title="Xe" sub="Chọn xe đã đăng ký hoặc thêm mới"/>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <div className="aw-card" style={{
              flex: 1, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              borderColor: 'var(--primary)', background: 'var(--primary-soft)',
            }}>
              <Icons.Bike size={18} stroke="var(--primary-ink)"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Honda Wave Alpha 110</div>
                <div style={{ fontSize: 11, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace" }}>59X1-456.78 · Đen</div>
              </div>
              <span className="aw-badge aw-badge-blue">Chọn</span>
            </div>
            <button className="aw-btn aw-btn-ghost" style={{ height: 'auto', alignSelf: 'stretch', padding: '0 14px', fontSize: 12 }}>
              <Icons.Plus size={13}/> Thêm xe
            </button>
          </div>

          {/* Services grid */}
          <StepHeader n="3" title="Dịch vụ" sub="Có thể chọn nhiều"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SERVICES.map(s => {
              const sel = selectedSvcs.has(s.id);
              return (
                <div key={s.id} onClick={() => toggle(s.id)} className="aw-card" style={{
                  padding: '12px 14px', cursor: 'pointer',
                  borderColor: sel ? 'var(--primary)' : 'var(--border)',
                  background: sel ? 'var(--primary-soft)' : 'var(--surface)',
                  transition: 'border-color .10s, background .10s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: '1.5px solid', borderColor: sel ? 'var(--primary)' : 'var(--border-strong)',
                      background: sel ? 'var(--primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {sel && <Icons.Check size={10} stroke="#fff" sw={3}/>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Geist Mono',monospace", color: 'var(--primary-ink)' }}>{formatVND(s.price)}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{s.time} ph</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: bill summary */}
        <aside style={{
          width: 280, flexShrink: 0,
          background: 'var(--surface)', borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Hoá đơn</div>
          </div>

          <div className="aw-scroll" style={{ flex: 1, padding: '14px 18px' }}>
            {selectedSvcs.size === 0 ? (
              <div style={{ color: 'var(--ink-400)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Chưa chọn dịch vụ</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {SERVICES.filter(s => selectedSvcs.has(s.id)).map((s, i, arr) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', fontSize: 12, borderBottom: i < arr.length - 1 ? '1px solid var(--surface-3)' : 'none' }}>
                    <span>{s.name}</span>
                    <span style={{ fontWeight: 600, fontFamily: "'Geist Mono',monospace" }}>{formatVND(s.price)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { l: 'Thời gian', v: totalTime ? totalTime + ' phút' : '—' },
                { l: 'Tích điểm', v: selectedSvcs.size ? '+' + points : '—', accent: 'var(--green-ink)' },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--ink-500)' }}>{r.l}</span>
                  <span style={{ fontWeight: 600, color: r.accent || 'var(--ink-900)', fontFamily: "'Geist Mono',monospace" }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Tổng cộng</span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(total)}</span>
            </div>
            <button className="aw-btn aw-btn-primary" style={{ width: '100%', height: 40, fontSize: 13, fontWeight: 600 }}>
              <Icons.Plus size={14} sw={2.5}/> Tạo lịch & In hoá đơn
            </button>
            <button className="aw-btn aw-btn-ghost aw-btn-sm" style={{ width: '100%' }}>Lưu nháp</button>
          </div>
        </aside>
      </div>
    </StaffShell>
  );
}

function StepHeader({ n, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        background: 'var(--primary)', color: '#fff',
        fontSize: 10, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{n}</div>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{sub}</span>}
    </div>
  );
}

Object.assign(window, { StaffLogin, StaffQueue, StaffWalkin });
