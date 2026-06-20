import { useEffect, useState } from 'react'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { listTiers, updateTier } from '../../api/tiers.js'
import { TierBadge, tierKey } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { AdminShell } from '../../components/layout/AdminShell.jsx'
import { Field, PageContainer } from '../../components/ui.jsx'
import { formatVNDShort } from '../../utils/format.js'

export function AdminTiers() {
  const [tiers, setTiers] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refresh = () => listTiers().then((data) => setTiers(unwrapPaged(data))).catch((err) => setError(getApiError(err, 'Không tải được hạng.')))
  useEffect(() => { refresh() }, [])

  const edit = (tier) => {
    setEditingId(tier.tierId)
    setDraft({ ...tier })
  }

  const save = async () => {
    try {
      await updateTier(editingId, {
        ...draft,
        rankOrder: Number(draft.rankOrder),
        bookingWindowDays: Number(draft.bookingWindowDays),
        minVisitsPerMonth: Number(draft.minVisitsPerMonth),
        minSpendPerMonth: Number(draft.minSpendPerMonth),
        pointsPerWash: Number(draft.pointsPerWash),
      })
      setEditingId(null)
      setDraft(null)
      setMessage('Cập nhật thành công.')
      refresh()
    } catch (err) {
      setError(getApiError(err, 'Không lưu được hạng.'))
    }
  }

  return (
    <AdminShell active="tiers" title="Cấu hình hạng thành viên"
      headerActions={editingId && <button className="aw-btn aw-btn-primary aw-btn-sm" onClick={save}>Lưu</button>}
    >
      <PageContainer>
        {(error || message) && <div style={{ marginBottom: 12, color: error ? 'var(--danger)' : 'var(--green-ink)', fontSize: 13 }}>{error || message}</div>}
        <div className="aw-card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Coins size={18} stroke="var(--primary-ink)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Quy tắc điểm</div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>Cấu hình điểm mỗi lượt rửa, ngưỡng lượt và chi tiêu theo tháng.</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {tiers.map((tier) => {
            const active = editingId === tier.tierId
            const value = active ? draft : tier
            return (
              <div key={tier.tierId} className="aw-card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => edit(tier)}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hạng {tier.rankOrder}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}><TierBadge tier={tierKey(tier.tierName)} /></div>
                  </div>
                  <Icons.Star size={22} stroke="var(--gold)" />
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <TierField active={active} label="Cửa sổ đặt lịch" value={value.bookingWindowDays} onChange={(v) => setDraft({ ...draft, bookingWindowDays: v })} suffix="ngày" />
                  <TierField active={active} label="Điểm mỗi lượt" value={value.pointsPerWash} onChange={(v) => setDraft({ ...draft, pointsPerWash: v })} suffix="điểm" />
                  <TierField active={active} label="Lượt tối thiểu" value={value.minVisitsPerMonth} onChange={(v) => setDraft({ ...draft, minVisitsPerMonth: v })} suffix="lượt" />
                  <TierField active={active} label="Chi tiêu tối thiểu" value={value.minSpendPerMonth} onChange={(v) => setDraft({ ...draft, minSpendPerMonth: v })} suffix="₫" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="aw-card" style={{ padding: '16px 24px', marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Xem trước ngưỡng chi tiêu</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(tiers.length, 1)}, 1fr)`, gap: 8 }}>
            {tiers.map((tier) => (
              <div key={tier.tierId} style={{ textAlign: 'center' }}>
                <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(90deg, var(--tier-dong), var(--tier-bac), var(--tier-vang), var(--tier-platinum))' }} />
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700 }}>{tier.tierName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-500)' }}>{formatVNDShort(tier.minSpendPerMonth)}₫</div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </AdminShell>
  )
}

function TierField({ active, label, value, onChange, suffix }) {
  return (
    <Field label={label}>
      {active ? (
        <input className="aw-input" type="number" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div style={{ fontFamily: "'Geist Mono',monospace", fontWeight: 700 }}>{value} {suffix}</div>
      )}
    </Field>
  )
}
