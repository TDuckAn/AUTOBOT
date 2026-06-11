/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from 'react'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { createPricing, createService, listAdminServices, listPricing, updatePricing, updateService } from '../../api/services.js'
import { createVehicleType, deleteVehicleType, listVehicleTypes } from '../../api/vehicleTypes.js'
import { Icons } from '../../components/icons.jsx'
import { AdminShell } from '../../components/layout/AdminShell.jsx'
import { Field, PageContainer, Td, Th } from '../../components/ui.jsx'
import { formatVND } from '../../utils/format.js'

const blankService = { name: '', description: '', isActive: true }
const blankPricingEntry = () => ({ durationMinutes: 30, price: '' })

export function AdminServices() {
  const [tab, setTab] = useState('services')  // 'services' | 'vehicletypes'

  // --- Service state ---
  const [services, setServices] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(blankService)
  const [pricing, setPricing] = useState([])
  // Pricing edits (both create & edit mode): { [vehicleTypeId]: { durationMinutes, price } }
  const [pricingDrafts, setPricingDrafts] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // --- VehicleType state ---
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [vtName, setVtName] = useState('')
  const [vtError, setVtError] = useState('')
  const [vtLoading, setVtLoading] = useState(false)

  const loadVehicleTypes = useCallback(async () => {
    try {
      const data = await listVehicleTypes()
      setVehicleTypes(data)
    } catch {
      // ignore
    }
  }, [])

  // Build the editable draft map for a service's pricing rows, one per vehicle type.
  const draftsFromPricing = useCallback((rows) => Object.fromEntries(
    vehicleTypes.map((vt) => {
      const existing = rows.find((p) => p.vehicleTypeId === vt.vehicleTypeId)
      return [vt.vehicleTypeId, existing
        ? { durationMinutes: existing.durationMinutes, price: String(existing.price) }
        : blankPricingEntry()]
    }),
  ), [vehicleTypes])

  const selectService = async (service) => {
    setSelected(service)
    setForm({ name: service.name, description: service.description ?? '', isActive: service.isActive })
    const rows = unwrapPaged(await listPricing(service.serviceId))
    setPricing(rows)
    setPricingDrafts(draftsFromPricing(rows))
  }

  const refresh = async () => {
    try {
      const data = await listAdminServices()
      const rows = unwrapPaged(data)
      setServices(rows)
      return rows
    } catch (err) {
      setError(getApiError(err, 'Không tải được dịch vụ.'))
      return []
    }
  }

  useEffect(() => {
    let alive = true
    loadVehicleTypes()
    refresh().then((rows) => {
      if (alive && rows[0]) selectService(rows[0])
    })
    return () => { alive = false }
  }, [loadVehicleTypes])

  const toggleActive = async () => {
    if (!selected) return
    setError('')
    setSaving(true)
    try {
      await updateService(selected.serviceId, { ...form, isActive: !form.isActive })
      const next = { ...form, isActive: !form.isActive }
      setForm(next)
      setSelected({ ...selected, isActive: next.isActive })
      setMessage(next.isActive ? 'Đã kích hoạt dịch vụ.' : 'Đã tắt dịch vụ.')
      await refresh()
    } catch (err) {
      setError(getApiError(err, 'Không cập nhật được trạng thái.'))
    } finally {
      setSaving(false)
    }
  }

  const newService = () => {
    setSelected(null)
    setForm(blankService)
    setPricing([])
    setPricingDrafts(Object.fromEntries(vehicleTypes.map((vt) => [vt.vehicleTypeId, blankPricingEntry()])))
    setMessage('')
    setError('')
  }

  // Persist the service plus every price row that has a value. Existing rows whose
  // price/duration changed are updated; vehicle types without a price yet are created.
  const persistPricing = async (serviceId) => {
    for (const vt of vehicleTypes) {
      const existing = pricing.find((p) => p.vehicleTypeId === vt.vehicleTypeId) ?? null
      const draft = pricingDrafts[vt.vehicleTypeId]
        ?? (existing ? { durationMinutes: existing.durationMinutes, price: String(existing.price) } : null)
      if (!draft) continue

      const price = Number(draft.price)
      if (draft.price === '' || !(price > 0)) continue

      const payload = {
        vehicleTypeId: vt.vehicleTypeId,
        durationMinutes: Math.max(1, Number(draft.durationMinutes) || 1),
        price,
        isActive: existing ? existing.isActive : true,
      }

      if (existing) {
        const changed = price !== existing.price || payload.durationMinutes !== existing.durationMinutes
        if (changed) await updatePricing(serviceId, existing.pricingId, payload)
      } else {
        await createPricing(serviceId, payload)
      }
    }
  }

  const saveService = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const saved = selected
        ? await updateService(selected.serviceId, form)
        : await createService(form)

      await persistPricing(saved.serviceId)

      setMessage(selected ? 'Đã cập nhật dịch vụ và bảng giá.' : 'Đã tạo dịch vụ.')
      await refresh()
      await selectService(saved)
    } catch (err) {
      setError(getApiError(err, 'Không lưu được dịch vụ.'))
    } finally {
      setSaving(false)
    }
  }

  // VehicleType actions
  const addVehicleType = async (e) => {
    e.preventDefault()
    if (!vtName.trim()) return
    setVtError('')
    setVtLoading(true)
    try {
      await createVehicleType({ name: vtName.trim() })
      setVtName('')
      await loadVehicleTypes()
    } catch (err) {
      setVtError(getApiError(err, 'Không thêm được loại xe.'))
    } finally {
      setVtLoading(false)
    }
  }

  const removeVehicleType = async (id) => {
    setVtError('')
    try {
      await deleteVehicleType(id)
      await loadVehicleTypes()
    } catch (err) {
      setVtError(getApiError(err, 'Không xoá được loại xe.'))
    }
  }

  return (
    <AdminShell
      active="services" title="Dịch vụ & giá"
      headerActions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`aw-btn aw-btn-sm ${tab === 'services' ? 'aw-btn-primary' : 'aw-btn-ghost'}`} onClick={() => setTab('services')}>
            <Icons.Box size={13} /> Dịch vụ
          </button>
          <button className={`aw-btn aw-btn-sm ${tab === 'vehicletypes' ? 'aw-btn-primary' : 'aw-btn-ghost'}`} onClick={() => setTab('vehicletypes')}>
            <Icons.Bike size={13} /> Loại xe
          </button>
          {tab === 'services' && (
            <button className="aw-btn aw-btn-green aw-btn-sm" onClick={newService}>
              <Icons.Plus size={13} /> Dịch vụ mới
            </button>
          )}
        </div>
      }
    >
      <PageContainer style={{ maxWidth: 'min(1720px, calc(100vw - 48px))' }}>
        {tab === 'services' && (
          <>
            {(error || message) && (
              <div style={{ marginBottom: 12, color: error ? 'var(--danger)' : 'var(--green-ink)', fontSize: 13 }}>{error || message}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(420px, 0.65fr)', gap: 16 }}>
              <div className="aw-card" style={{ overflow: 'hidden' }}>
                <table className="aw-table">
                  <thead><tr><Th>Dịch vụ</Th><Th>Mô tả</Th><Th>Trạng thái</Th></tr></thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.serviceId} onClick={() => selectService(service)}
                        style={{ background: selected?.serviceId === service.serviceId ? 'var(--primary-soft)' : 'transparent', cursor: 'pointer' }}>
                        <Td><b>{service.name}</b></Td>
                        <Td>{service.description ?? '-'}</Td>
                        <Td>{service.isActive ? 'Đang bán' : 'Tạm tắt'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form onSubmit={saveService} className="aw-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{selected ? 'Chỉnh sửa dịch vụ' : 'Tạo dịch vụ mới'}</div>

                <Field label="Tên dịch vụ">
                  <input className="aw-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </Field>
                <Field label="Mô tả">
                  <textarea className="aw-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                </Field>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Đang hoạt động
                </label>

                {/* Pricing section — always shown when vehicle types exist */}
                {vehicleTypes.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Bảng giá theo loại xe</div>

                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', padding: '0 2px' }}>
                      <div>Loại xe</div>
                      <div>Thời gian</div>
                      <div>Giá (₫)</div>
                    </div>

                    {vehicleTypes.map((vt) => {
                      const existing = selected ? (pricing.find((p) => p.vehicleTypeId === vt.vehicleTypeId) ?? null) : null
                      const val = pricingDrafts[vt.vehicleTypeId]
                        ?? (existing ? { durationMinutes: existing.durationMinutes, price: String(existing.price) } : blankPricingEntry())
                      return (
                        <div key={vt.vehicleTypeId} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 6, alignItems: 'center' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: existing || !selected ? 'var(--ink-700)' : 'var(--ink-400)', paddingLeft: 2 }}>
                            {vt.name}
                            {selected && !existing && <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 6, color: 'var(--ink-300)' }}>chưa có giá</span>}
                          </div>
                          <input
                            className="aw-input" type="number" min={1} max={1440}
                            value={val.durationMinutes}
                            onChange={(e) => setPricingDrafts((p) => ({ ...p, [vt.vehicleTypeId]: { ...val, durationMinutes: e.target.value } }))}
                            placeholder="Phút"
                          />
                          <input
                            className="aw-input" type="number" min={0}
                            value={val.price}
                            onChange={(e) => setPricingDrafts((p) => ({ ...p, [vt.vehicleTypeId]: { ...val, price: e.target.value } }))}
                            placeholder="Chưa đặt giá"
                            title={val.price ? formatVND(val.price) : ''}
                          />
                        </div>
                      )
                    })}

                    <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: -4 }}>
                      Bỏ trống cột giá để bỏ qua loại xe đó. Nhấn “Lưu dịch vụ” để lưu cả giá.
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="aw-btn aw-btn-primary" disabled={saving}>
                    {saving ? 'Đang lưu…' : 'Lưu dịch vụ'}
                  </button>
                  {selected && (
                    <button type="button" className={`aw-btn ${form.isActive ? 'aw-btn-danger' : 'aw-btn-ghost'}`} disabled={saving} onClick={toggleActive}>
                      {form.isActive ? 'Tắt dịch vụ' : 'Kích hoạt'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}

        {tab === 'vehicletypes' && (
          <div style={{ maxWidth: 760 }}>
            <div className="aw-card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Quản lý loại xe</div>
              {vtError && <div style={{ marginBottom: 12, color: 'var(--danger)', fontSize: 13 }}>{vtError}</div>}
              <form onSubmit={addVehicleType} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input
                  className="aw-input" style={{ flex: 1 }} value={vtName}
                  onChange={(e) => setVtName(e.target.value)}
                  placeholder="Tên loại xe mới (vd: Xe ba bánh)" required
                />
                <button className="aw-btn aw-btn-primary" disabled={vtLoading}>
                  <Icons.Plus size={13} /> {vtLoading ? 'Đang thêm…' : 'Thêm'}
                </button>
              </form>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {vehicleTypes.map((vt) => (
                  <div key={vt.vehicleTypeId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icons.Bike size={14} stroke="var(--primary-ink)" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{vt.name}</span>
                    </div>
                    <button
                      className="aw-btn aw-btn-ghost aw-btn-sm"
                      style={{ color: 'var(--danger)', fontSize: 11 }}
                      onClick={() => removeVehicleType(vt.vehicleTypeId)}
                    >
                      <Icons.Trash size={12} /> Xoá
                    </button>
                  </div>
                ))}
                {vehicleTypes.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--ink-400)', fontSize: 13, padding: '20px 0' }}>
                    Chưa có loại xe nào
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-400)' }}>
              Lưu ý: Không thể xoá loại xe đang được dùng trong bảng giá hoặc xe khách đã đăng ký.
            </div>
          </div>
        )}
      </PageContainer>
    </AdminShell>
  )
}
