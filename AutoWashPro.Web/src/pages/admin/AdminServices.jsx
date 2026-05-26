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
  // Create-mode inline pricing: { [vehicleTypeName]: { durationMinutes, price } }
  const [newServicePricing, setNewServicePricing] = useState({})
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

  const refreshPricing = async (serviceId) => {
    setPricing(unwrapPaged(await listPricing(serviceId)))
  }

  const selectService = async (service) => {
    setSelected(service)
    setForm({ name: service.name, description: service.description ?? '', isActive: service.isActive })
    setPricing(unwrapPaged(await listPricing(service.serviceId)))
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
    setNewServicePricing(Object.fromEntries(vehicleTypes.map((vt) => [vt.name, blankPricingEntry()])))
    setMessage('')
    setError('')
  }

  const saveService = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const saved = selected
        ? await updateService(selected.serviceId, form)
        : await createService(form)

      // In create mode: persist any pricing rows that have a price filled in
      if (!selected) {
        const entries = Object.entries(newServicePricing)
          .filter(([, v]) => v.price !== '' && Number(v.price) > 0)
        for (const [vehicleType, { durationMinutes, price }] of entries) {
          await createPricing(saved.serviceId, {
            vehicleType,
            durationMinutes: Math.max(1, Number(durationMinutes) || 1),
            price: Number(price),
            isActive: true,
          })
        }
      }

      setMessage(selected ? 'Đã cập nhật dịch vụ.' : 'Đã tạo dịch vụ.')
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 36px', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', padding: '0 2px' }}>
                      <div>Loại xe</div>
                      <div>Thời gian</div>
                      <div>Giá (₫)</div>
                      <div />
                    </div>

                    {selected ? (
                      // Edit mode: one row per vehicle type, pre-filled from existing pricing
                      vehicleTypes.map((vt) => (
                        <PricingRow
                          key={vt.vehicleTypeId}
                          vehicleType={vt.name}
                          serviceId={selected.serviceId}
                          existing={pricing.find((p) => p.vehicleType === vt.name) ?? null}
                          onRefresh={() => refreshPricing(selected.serviceId)}
                        />
                      ))
                    ) : (
                      // Create mode: one editable row per vehicle type
                      vehicleTypes.map((vt) => {
                        const val = newServicePricing[vt.name] ?? blankPricingEntry()
                        return (
                          <div key={vt.vehicleTypeId} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 36px', gap: 6, alignItems: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-700)', paddingLeft: 2 }}>{vt.name}</div>
                            <input
                              className="aw-input" type="number" min={1} max={1440}
                              value={val.durationMinutes}
                              onChange={(e) => setNewServicePricing((p) => ({ ...p, [vt.name]: { ...val, durationMinutes: e.target.value } }))}
                              placeholder="Phút"
                            />
                            <input
                              className="aw-input" type="number" min={0}
                              value={val.price}
                              onChange={(e) => setNewServicePricing((p) => ({ ...p, [vt.name]: { ...val, price: e.target.value } }))}
                              placeholder="Chưa đặt giá"
                            />
                            <div />
                          </div>
                        )
                      })
                    )}

                    {!selected && (
                      <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: -4 }}>
                        Bỏ trống cột giá để bỏ qua loại xe đó khi tạo.
                      </div>
                    )}
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
              Lưu ý: Xoá loại xe sẽ không ảnh hưởng đến các bảng giá và xe khách đã đăng ký trước đó.
            </div>
          </div>
        )}
      </PageContainer>
    </AdminShell>
  )
}

function PricingRow({ vehicleType, serviceId, existing, onRefresh }) {
  const [draft, setDraft] = useState(() =>
    existing
      ? { durationMinutes: existing.durationMinutes, price: existing.price, isActive: existing.isActive }
      : { durationMinutes: 30, price: '', isActive: true }
  )
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(false)
  const [rowError, setRowError] = useState('')

  // Sync only when the pricingId itself changes (entry created or swapped), not on every re-render
  useEffect(() => {
    if (existing) {
      setDraft({ durationMinutes: existing.durationMinutes, price: existing.price, isActive: existing.isActive })
    }
  }, [existing?.pricingId])

  const save = async () => {
    if (draft.price === '' || Number(draft.price) <= 0) return
    setSaving(true)
    setRowError('')
    try {
      const payload = {
        vehicleType,
        durationMinutes: Math.max(1, Number(draft.durationMinutes) || 1),
        price: Number(draft.price),
        isActive: draft.isActive,
      }
      if (existing) {
        await updatePricing(serviceId, existing.pricingId, payload)
      } else {
        await createPricing(serviceId, payload)
      }
      setFlash(true)
      setTimeout(() => setFlash(false), 1800)
      await onRefresh()
    } catch (err) {
      setRowError(getApiError(err, 'Lỗi lưu giá.'))
    } finally {
      setSaving(false)
    }
  }

  const isNew = !existing
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 36px', gap: 6, alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isNew ? 'var(--ink-400)' : 'var(--ink-700)', paddingLeft: 2 }}>
          {vehicleType}
          {isNew && <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 6, color: 'var(--ink-300)' }}>chưa có giá</span>}
        </div>
        <input
          className="aw-input" type="number" min={1} max={1440}
          value={draft.durationMinutes}
          onChange={(e) => setDraft({ ...draft, durationMinutes: e.target.value })}
          placeholder="Phút"
        />
        <input
          className="aw-input" type="number" min={0}
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          placeholder={isNew ? 'Nhập giá để thêm' : ''}
          title={draft.price ? formatVND(draft.price) : ''}
        />
        <button
          type="button"
          className={`aw-btn aw-btn-sm ${flash ? 'aw-btn-green' : isNew ? 'aw-btn-ghost' : 'aw-btn-ghost'}`}
          style={isNew ? { borderStyle: 'dashed' } : {}}
          onClick={save}
          disabled={saving || draft.price === '' || Number(draft.price) <= 0}
          title={isNew ? 'Thêm giá' : 'Lưu thay đổi'}
        >
          {saving ? '…' : flash ? <Icons.Check size={13} stroke="var(--green-ink)" /> : isNew ? <Icons.Plus size={13} /> : <Icons.Check size={13} />}
        </button>
      </div>
      {rowError && <div style={{ fontSize: 11, color: 'var(--danger)', paddingLeft: 2, marginTop: -4 }}>{rowError}</div>}
    </>
  )
}
