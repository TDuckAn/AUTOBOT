/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { createPricing, createService, listPricing, listServices, updatePricing, updateService } from '../../api/services.js'
import { Icons } from '../../components/icons.jsx'
import { AdminShell } from '../../components/layout/AdminShell.jsx'
import { Field, PageContainer, Td, Th } from '../../components/ui.jsx'
import { formatVND } from '../../utils/format.js'

const blankService = { name: '', description: '', isActive: true }
const blankPricing = { vehicleType: 'Scooter', durationMinutes: 30, price: 0, isActive: true }

export function AdminServices() {
  const [services, setServices] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(blankService)
  const [pricing, setPricing] = useState([])
  const [pricingForm, setPricingForm] = useState(blankPricing)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectService = async (service) => {
    setSelected(service)
    setForm({ name: service.name, description: service.description ?? '', isActive: service.isActive })
    setPricing(unwrapPaged(await listPricing(service.serviceId)))
  }

  const refresh = async () => {
    try {
      const data = await listServices()
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
    refresh().then((rows) => {
      if (alive && rows[0]) selectService(rows[0])
    })
    return () => { alive = false }
  }, [])

  const newService = () => {
    setSelected(null)
    setForm(blankService)
    setPricing([])
    setMessage('')
    setError('')
  }

  const saveService = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const saved = selected ? await updateService(selected.serviceId, form) : await createService(form)
      setMessage('Đã lưu dịch vụ.')
      await refresh()
      await selectService(saved)
    } catch (err) {
      setError(getApiError(err, 'Không lưu được dịch vụ.'))
    }
  }

  const savePricing = async (row) => {
    try {
      const payload = { vehicleType: row.vehicleType, durationMinutes: Number(row.durationMinutes), price: Number(row.price), isActive: row.isActive }
      await updatePricing(selected.serviceId, row.pricingId, payload)
      setPricing(unwrapPaged(await listPricing(selected.serviceId)))
      setMessage('Đã lưu bảng giá.')
    } catch (err) {
      setError(getApiError(err, 'Không lưu được bảng giá.'))
    }
  }

  const addPricing = async () => {
    if (!selected) return
    try {
      await createPricing(selected.serviceId, { ...pricingForm, durationMinutes: Number(pricingForm.durationMinutes), price: Number(pricingForm.price) })
      setPricingForm(blankPricing)
      setPricing(unwrapPaged(await listPricing(selected.serviceId)))
    } catch (err) {
      setError(getApiError(err, 'Không thêm được bảng giá.'))
    }
  }

  return (
    <AdminShell active="services" title="Dịch vụ & giá" headerActions={<button className="aw-btn aw-btn-primary aw-btn-sm" onClick={newService}><Icons.Plus size={13} /> Dịch vụ mới</button>}>
      <PageContainer style={{ maxWidth: 1320 }}>
        {(error || message) && <div style={{ marginBottom: 12, color: error ? 'var(--danger)' : 'var(--green-ink)', fontSize: 13 }}>{error || message}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 16 }}>
          <div className="aw-card" style={{ overflow: 'hidden' }}>
            <table className="aw-table">
              <thead><tr><Th>Dịch vụ</Th><Th>Mô tả</Th><Th>Trạng thái</Th></tr></thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.serviceId} onClick={() => selectService(service)} style={{ background: selected?.serviceId === service.serviceId ? 'var(--primary-soft)' : 'transparent', cursor: 'pointer' }}>
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
            <Field label="Tên dịch vụ"><input className="aw-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Mô tả"><textarea className="aw-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Đang hoạt động</label>
            <button className="aw-btn aw-btn-primary" style={{ alignSelf: 'flex-start' }}>Lưu dịch vụ</button>

            {selected && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>Bảng giá</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {pricing.map((row) => (
                    <PricingRow key={row.pricingId} row={row} onSave={savePricing} />
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 34px', gap: 6 }}>
                    <input className="aw-input" value={pricingForm.vehicleType} onChange={(e) => setPricingForm({ ...pricingForm, vehicleType: e.target.value })} />
                    <input className="aw-input" type="number" value={pricingForm.durationMinutes} onChange={(e) => setPricingForm({ ...pricingForm, durationMinutes: e.target.value })} />
                    <input className="aw-input" type="number" value={pricingForm.price} onChange={(e) => setPricingForm({ ...pricingForm, price: e.target.value })} />
                    <button type="button" className="aw-btn aw-btn-green aw-btn-sm" onClick={addPricing}><Icons.Plus size={13} /></button>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      </PageContainer>
    </AdminShell>
  )
}

function PricingRow({ row, onSave }) {
  const [draft, setDraft] = useState(row)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr 34px', gap: 6, alignItems: 'center' }}>
      <input className="aw-input" value={draft.vehicleType} onChange={(e) => setDraft({ ...draft, vehicleType: e.target.value })} />
      <input className="aw-input" type="number" value={draft.durationMinutes} onChange={(e) => setDraft({ ...draft, durationMinutes: e.target.value })} />
      <input className="aw-input" type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} title={formatVND(draft.price)} />
      <button type="button" className="aw-btn aw-btn-ghost aw-btn-sm" onClick={() => onSave(draft)}><Icons.Check size={13} /></button>
    </div>
  )
}
