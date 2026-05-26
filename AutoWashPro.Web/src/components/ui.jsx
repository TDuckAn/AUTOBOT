export function PageContainer({ children, style }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: 'min(1760px, calc(100vw - 48px))',
      margin: '0 auto',
      padding: 'clamp(20px, 2vw, 32px)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function Th({ children, w }) {
  return (
    <th style={{
      padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
      color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em',
      background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', width: w,
    }}>{children}</th>
  )
}

export function Td({ children, mono }) {
  return (
    <td style={{
      padding: '10px 14px', fontSize: 13, color: 'var(--ink-900)', verticalAlign: 'middle',
      borderBottom: '1px solid var(--surface-3)', fontFamily: mono ? "'Geist Mono',monospace" : 'inherit',
      fontWeight: mono ? 500 : 'inherit',
    }}>{children}</td>
  )
}

export function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  )
}

export function EmptyState({ title = 'Không có dữ liệu', children }) {
  return (
    <div style={{ padding: 28, color: 'var(--ink-500)', textAlign: 'center', fontSize: 13 }}>
      <div style={{ fontWeight: 700, color: 'var(--ink-700)', marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  )
}
