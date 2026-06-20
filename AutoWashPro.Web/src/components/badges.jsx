/* eslint-disable react-refresh/only-export-components */
import { Icons } from './icons.jsx'

const TIERS = [
  { id: 'dong', names: ['member', 'dong', 'đồng'], label: 'Đồng', className: 'aw-tier-dong', color: 'var(--tier-dong)' },
  { id: 'bac', names: ['silver', 'bac', 'bạc'], label: 'Bạc', className: 'aw-tier-bac', color: 'var(--tier-bac)' },
  { id: 'vang', names: ['gold', 'vang', 'vàng'], label: 'Vàng', className: 'aw-tier-vang', color: 'var(--tier-vang)' },
  { id: 'platinum', names: ['platinum', 'bach kim', 'bạch kim'], label: 'Bạch Kim', className: 'aw-tier-platinum', color: 'var(--tier-platinum)' },
]

export function tierKey(tier) {
  const value = String(tier ?? '').toLowerCase()
  return TIERS.find((item) => item.id === value || item.names.includes(value))?.id ?? 'dong'
}

export function tierLabel(tier) {
  return TIERS.find((item) => item.id === tierKey(tier))?.label ?? 'Đồng'
}

export function TierBadge({ tier, size = 'md' }) {
  const item = TIERS.find((entry) => entry.id === tierKey(tier)) ?? TIERS[0]
  const style = size === 'lg'
    ? { padding: '6px 12px 6px 10px', fontSize: 12 }
    : size === 'sm'
      ? { padding: '2px 8px 2px 6px', fontSize: 10 }
      : undefined

  return (
    <span className={`aw-tier-badge ${item.className}`} style={style}>
      <Icons.Star size={10} fill={item.color} stroke={item.color} sw={1} />
      {item.label}
    </span>
  )
}

export function StatusPill({ status }) {
  const key = String(status ?? 'queued').toLowerCase()
  const map = {
    upcoming: { label: 'Sắp tới', bg: 'oklch(94% 0.03 210)', color: 'var(--primary-ink)' },
    confirmed: { label: 'Đang chờ', bg: 'var(--surface-2)', color: 'var(--ink-700)' },
    queued: { label: 'Đang chờ', bg: 'var(--surface-2)', color: 'var(--ink-700)' },
    completed: { label: 'Hoàn tất', bg: 'var(--green-soft)', color: 'var(--green-ink)' },
    cancelled: { label: 'Đã huỷ', bg: 'var(--danger-soft)', color: 'var(--danger)' },
    'in-progress': { label: 'Đang rửa', bg: 'oklch(94% 0.06 75)', color: 'var(--gold-ink)' },
    active: { label: 'Đang hoạt động', bg: 'var(--green-soft)', color: 'var(--green-ink)' },
    expired: { label: 'Hết hạn', bg: 'var(--surface-2)', color: 'var(--ink-500)' },
  }
  const item = map[key] ?? map.queued

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, background: item.bg, color: item.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {item.label}
    </span>
  )
}
