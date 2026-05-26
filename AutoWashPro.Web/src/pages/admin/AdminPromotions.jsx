import { useEffect, useState } from 'react'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { createPromotion, deletePromotion, listPromotions, updatePromotion } from '../../api/promotions.js'
import { listTiers } from '../../api/tiers.js'
import { adminCreateVoucherRule, adminDeleteVoucherRule, adminListVoucherRules, adminUpdateVoucherRule } from '../../api/vouchers.js'
import { StatusPill } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { AdminShell } from '../../components/layout/AdminShell.jsx'
import { Field, PageContainer, Td, Th } from '../../components/ui.jsx'
import { formatVND } from '../../utils/format.js'

const today = new Date().toISOString().slice(0, 10)
const blank = { name: '', description: '', rewardType: 'Discount', rewardValue: 0, startDate: today, endDate: today, minTierId: '', isActive: true }
const blankRule = { name: '', description: '', pointCost: 100, discountAmount: 10000, isActive: true }

export function AdminPromotions() {
  const [tab, setTab] = useState('promotions')  // 'promotions' | 'voucher-rules'
  const [promotions, setPromotions] = useState([])
  const [tiers, setTiers] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Voucher rules state
  const [voucherRules, setVoucherRules] = useState([])
  const [ruleForm, setRuleForm] = useState(blankRule)
  const [editingRule, setEditingRule] = useState(null)
  const [ruleError, setRuleError] = useState('')
  const [ruleSaving, setRuleSaving] = useState(false)

  const refresh = () => listPromotions().then((data) => setPromotions(unwrapPaged(data))).catch((err) => setError(getApiError(err, 'Không tải được khuyến mãi.')))
  const refreshRules = () => adminListVoucherRules().then(setVoucherRules).catch((err) => setRuleError(getApiError(err, 'Không tải được quy tắc.')))

  useEffect(() => {
    refresh()
    refreshRules()
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

  const saveRule = async (e) => {
    e.preventDefault()
    setRuleError('')
    setRuleSaving(true)
    try {
      const payload = { ...ruleForm, pointCost: Number(ruleForm.pointCost), discountAmount: Number(ruleForm.discountAmount) }
      if (editingRule) {
        await adminUpdateVoucherRule(editingRule.voucherRuleId, payload)
      } else {
        await adminCreateVoucherRule(payload)
      }
      setRuleForm(blankRule)
      setEditingRule(null)
      await refreshRules()
    } catch (err) {
      setRuleError(getApiError(err, 'Không lưu được quy tắc.'))
    } finally {
      setRuleSaving(false)
    }
  }

  const deleteRule = async (id) => {
    if (!confirm('Xoá quy tắc này?')) return
    try {
      await adminDeleteVoucherRule(id)
      await refreshRules()
    } catch (err) {
      setRuleError(getApiError(err, 'Không xoá được quy tắc.'))
    }
  }

  return (
    <AdminShell active="promotions" title="Khuyến mãi"
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`aw-btn aw-btn-sm ${tab === 'promotions' ? 'aw-btn-primary' : 'aw-btn-ghost'}`} onClick={() => setTab('promotions')}>
            <Icons.Tag size={13} /> Khuyến mãi
          </button>
          <button className={`aw-btn aw-btn-sm ${tab === 'voucher-rules' ? 'aw-btn-primary' : 'aw-btn-ghost'}`} onClick={() => setTab('voucher-rules')}>
            <Icons.Gift size={13} /> Voucher điểm
          </button>
          {tab === 'promotions' && (
            <button className="aw-btn aw-btn-green aw-btn-sm" onClick={createMode}>
              <Icons.Plus size={13} /> Tạo khuyến mãi
            </button>
          )}
        </div>
      }
    >
      <PageContainer style={{ maxWidth: 'min(1720px, calc(100vw - 48px))' }}>
        {tab === 'promotions' && (
          <>
        {(error || message) && <div style={{ marginBottom: 12, color: error ? 'var(--danger)' : 'var(--green-ink)', fontSize: 13 }}>{error || message}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(380px, 440px)', gap: 16 }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
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
              <Field label="Loại"><select className="aw-input" value={form.rewardType} onChange={(e) => setForm({ ...form, rewardType: e.target.value })}><option>Discount</option><option>BonusPoints</option></select></Field>
              <Field label="Giá trị"><input className="aw-input" type="number" value={form.rewardValue} onChange={(e) => setForm({ ...form, rewardValue: Number(e.target.value) })} /></Field>
              <Field label="Bắt đầu"><input className="aw-input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
              <Field label="Kết thúc"><input className="aw-input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
            </div>
            <Field label="Hạng tối thiểu"><select className="aw-input" value={form.minTierId} onChange={(e) => setForm({ ...form, minTierId: e.target.value })}>{tiers.map((tier) => <option key={tier.tierId} value={tier.tierId}>{tier.tierName}</option>)}</select></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Đang hoạt động</label>
            <button className="aw-btn aw-btn-primary" style={{ alignSelf: 'flex-start' }}>Lưu</button>
          </form>
        </div>
          </>
        )}

        {tab === 'voucher-rules' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(380px, 440px)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Quy tắc đổi điểm lấy voucher</div>
              {ruleError && <div style={{ marginBottom: 12, color: 'var(--danger)', fontSize: 13 }}>{ruleError}</div>}
              <div className="aw-card" style={{ overflow: 'hidden' }}>
                <table className="aw-table">
                  <thead>
                    <tr>
                      <Th>Tên voucher</Th>
                      <Th>Điểm cần</Th>
                      <Th>Giảm giá</Th>
                      <Th>Trạng thái</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {voucherRules.map((rule) => (
                      <tr key={rule.voucherRuleId} style={{ cursor: 'pointer' }}
                        onClick={() => { setEditingRule(rule); setRuleForm({ name: rule.name, description: rule.description ?? '', pointCost: rule.pointCost, discountAmount: rule.discountAmount, isActive: rule.isActive }) }}>
                        <Td><b>{rule.name}</b>{rule.description && <div style={{ fontSize: 11, color: 'var(--ink-400)' }}>{rule.description}</div>}</Td>
                        <Td mono>{rule.pointCost.toLocaleString('vi-VN')} điểm</Td>
                        <Td mono>{formatVND(rule.discountAmount)}</Td>
                        <Td><StatusPill status={rule.isActive ? 'active' : 'expired'} /></Td>
                        <Td>
                          <button className="aw-btn aw-btn-ghost aw-btn-sm" style={{ color: 'var(--danger)' }}
                            onClick={(e) => { e.stopPropagation(); deleteRule(rule.voucherRuleId) }}>
                            <Icons.Trash size={12} />
                          </button>
                        </Td>
                      </tr>
                    ))}
                    {voucherRules.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>Chưa có quy tắc nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <form className="aw-card" onSubmit={saveRule} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{editingRule ? 'Chỉnh sửa' : 'Tạo quy tắc mới'}</div>
                {editingRule && (
                  <button type="button" className="aw-btn aw-btn-ghost aw-btn-sm"
                    onClick={() => { setEditingRule(null); setRuleForm(blankRule) }}>Huỷ</button>
                )}
              </div>
              <Field label="Tên voucher">
                <input className="aw-input" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} required />
              </Field>
              <Field label="Mô tả (tuỳ chọn)">
                <input className="aw-input" value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="Điểm cần đổi">
                  <input className="aw-input" type="number" min={1} value={ruleForm.pointCost} onChange={(e) => setRuleForm({ ...ruleForm, pointCost: e.target.value })} required />
                </Field>
                <Field label="Giảm giá (₫)">
                  <input className="aw-input" type="number" min={1} value={ruleForm.discountAmount} onChange={(e) => setRuleForm({ ...ruleForm, discountAmount: e.target.value })} required />
                </Field>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={ruleForm.isActive} onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })} /> Đang hoạt động
              </label>
              <button className="aw-btn aw-btn-primary" style={{ alignSelf: 'flex-start' }} disabled={ruleSaving}>
                {ruleSaving ? 'Đang lưu…' : <><Icons.Check size={13} /> {editingRule ? 'Cập nhật' : 'Tạo quy tắc'}</>}
              </button>
            </form>
          </div>
        )}
      </PageContainer>
    </AdminShell>
  )
}
