import { useEffect, useState } from 'react'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { createPromotion, deletePromotion, listPromotions, updatePromotion } from '../../api/promotions.js'
import { listTiers } from '../../api/tiers.js'
import { StatusPill } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { AdminShell } from '../../components/layout/AdminShell.jsx'
import { Field, PageContainer, Td, Th } from '../../components/ui.jsx'

const today = new Date().toISOString().slice(0, 10)
const blank = { name: '', description: '', rewardType: 'Discount', rewardValue: 0, startDate: today, endDate: today, minTierId: '', isActive: true }

export function AdminPromotions() {
  const [promotions, setPromotions] = useState([])
  const [tiers, setTiers] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = () => listPromotions().then((data) => setPromotions(unwrapPaged(data))).catch((err) => setError(getApiError(err, 'Không tải được khuyến mãi.')))

  useEffect(() => {
    refresh()
    listTiers().then((data) => {
      const rows = unwrapPaged(data)
      setTiers(rows)
      setForm((current) => ({ ...current, minTierId: rows[0]?.tierId ?? '' }))
    })
  }, [])

  const select = (promo) => {
    setSelected(promo)
    setForm({
      name: promo.name,
      description: promo.description ?? '',
      rewardType: promo.rewardType,
      rewardValue: promo.rewardValue,
      startDate: String(promo.startDate).slice(0, 10),
      endDate: String(promo.endDate).slice(0, 10),
      minTierId: promo.minTierId,
      isActive: promo.isActive,
    })
  }

  const createMode = () => {
    setSelected(null)
    setForm({ ...blank, minTierId: tiers[0]?.tierId ?? '' })
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      const saved = selected ? await updatePromotion(selected.promotionId, form) : await createPromotion(form)
      setMessage(selected ? 'Đã cập nhật khuyến mãi.' : 'Đã tạo khuyến mãi.')
      await refresh()
      select(saved)
    } catch (err) {
      setError(getApiError(err, 'Không lưu được khuyến mãi.'))
    }
  }

  const remove = async (promo) => {
    if (!confirm(`Xoá khuyến mãi ${promo.name}?`)) return
    await deletePromotion(promo.promotionId)
    setSelected(null)
    setForm({ ...blank, minTierId: tiers[0]?.tierId ?? '' })
    refresh()
  }

  return (
    <AdminShell active="promotions" title="Khuyến mãi" headerActions={<button className="aw-btn aw-btn-primary aw-btn-sm" onClick={createMode}><Icons.Plus size={13} /> Tạo khuyến mãi</button>}>
      <PageContainer style={{ maxWidth: 1320 }}>
        {(error || message) && <div style={{ marginBottom: 12, color: error ? 'var(--danger)' : 'var(--green-ink)', fontSize: 13 }}>{error || message}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
              {promotions.filter((p) => p.isActive).slice(0, 4).map((promo) => (
                <div key={promo.promotionId} className="aw-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{promo.name}</div>
                    <StatusPill status="active" />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 10 }}>{promo.description ?? 'Không có mô tả'}</div>
                  <div style={{ fontFamily: "'Geist Mono',monospace", fontWeight: 800 }}>{promo.rewardType} · {promo.rewardValue}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 8 }}>{promo.startDate} → {promo.endDate}</div>
                </div>
              ))}
            </div>

            <div className="aw-card" style={{ overflow: 'hidden' }}>
              <table className="aw-table">
                <thead><tr><Th>Tên</Th><Th>Loại</Th><Th>Giá trị</Th><Th>Hạng tối thiểu</Th><Th>Trạng thái</Th><Th></Th></tr></thead>
                <tbody>
                  {promotions.map((promo) => (
                    <tr key={promo.promotionId} onClick={() => select(promo)} style={{ background: selected?.promotionId === promo.promotionId ? 'var(--primary-soft)' : 'transparent', cursor: 'pointer' }}>
                      <Td><b>{promo.name}</b></Td>
                      <Td>{promo.rewardType}</Td>
                      <Td mono>{promo.rewardValue}</Td>
                      <Td>{promo.minTierName}</Td>
                      <Td><StatusPill status={promo.isActive ? 'active' : 'expired'} /></Td>
                      <Td><button className="aw-btn aw-btn-danger aw-btn-sm" onClick={(event) => { event.stopPropagation(); remove(promo) }}><Icons.Trash size={13} /></button></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form className="aw-card" onSubmit={submit} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{selected ? 'Chỉnh sửa' : 'Tạo khuyến mãi'}</div>
            <Field label="Tên"><input className="aw-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Mô tả"><textarea className="aw-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Loại"><select className="aw-input" value={form.rewardType} onChange={(e) => setForm({ ...form, rewardType: e.target.value })}><option>Discount</option><option>BonusPoints</option><option>FreeWash</option></select></Field>
              <Field label="Giá trị"><input className="aw-input" type="number" value={form.rewardValue} onChange={(e) => setForm({ ...form, rewardValue: Number(e.target.value) })} /></Field>
              <Field label="Bắt đầu"><input className="aw-input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
              <Field label="Kết thúc"><input className="aw-input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
            </div>
            <Field label="Hạng tối thiểu"><select className="aw-input" value={form.minTierId} onChange={(e) => setForm({ ...form, minTierId: e.target.value })}>{tiers.map((tier) => <option key={tier.tierId} value={tier.tierId}>{tier.tierName}</option>)}</select></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Đang hoạt động</label>
            <button className="aw-btn aw-btn-primary" style={{ alignSelf: 'flex-start' }}>Lưu</button>
          </form>
        </div>
      </PageContainer>
    </AdminShell>
  )
}
