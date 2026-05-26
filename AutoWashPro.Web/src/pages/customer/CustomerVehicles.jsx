import { useEffect, useState } from 'react'
import { addVehicle, deleteVehicle, getVehicles } from '../../api/customer.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { listVehicleTypes } from '../../api/vehicleTypes.js'
import { Icons } from '../../components/icons.jsx'
import { CustomerShell } from '../../components/layout/CustomerShell.jsx'
import { EmptyState, Field, PageContainer } from '../../components/ui.jsx'
import { formatDate } from '../../utils/format.js'

const blankForm = { licensePlate: '', vehicleType: '', brand: '' }

export function CustomerVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    try {
      const [vehicleData, types] = await Promise.all([getVehicles(), listVehicleTypes()])
      setVehicles(unwrapPaged(vehicleData))
      setVehicleTypes(types)
      if (types[0]) setForm((f) => ({ ...f, vehicleType: f.vehicleType || types[0].name }))
    } catch (err) {
      setError(getApiError(err, 'Không tải được danh sách xe.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { Promise.resolve().then(load) }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      await addVehicle({
        licensePlate: form.licensePlate.trim().toUpperCase(),
        vehicleType: form.vehicleType,
        brand: form.brand.trim() || undefined,
      })
      setMessage('Đã thêm xe thành công.')
      setForm(blankForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(getApiError(err, 'Không thể thêm xe.'))
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async (id) => {
    setError('')
    setMessage('')
    setDeletingId(id)
    try {
      await deleteVehicle(id)
      setMessage('Đã xoá xe.')
      setVehicles((prev) => prev.filter((v) => v.vehicleId !== id))
    } catch (err) {
      setError(getApiError(err, 'Không thể xoá xe.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <CustomerShell
      active="vehicles" title="Xe của tôi"
      headerActions={
        <button className="aw-btn aw-btn-primary aw-btn-sm" onClick={() => { setShowForm((v) => !v); setError(''); setMessage('') }}>
          <Icons.Plus size={13} sw={2.5} /> {showForm ? 'Đóng' : 'Thêm xe'}
        </button>
      }
    >
      <PageContainer>
        {(error || message) && (
          <div style={{ marginBottom: 16, fontSize: 13, color: error ? 'var(--danger)' : 'var(--green-ink)', padding: '9px 12px', borderRadius: 6, background: error ? 'var(--danger-soft)' : 'var(--green-soft)' }}>
            {error || message}
          </div>
        )}

        {showForm && (
          <form onSubmit={submit} className="aw-card" style={{ padding: '18px 20px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Thêm xe mới</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Biển số xe">
                <input
                  className="aw-input" value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                  placeholder="51G-123.45" style={{ fontFamily: "'Geist Mono',monospace", height: 38 }}
                  required
                />
              </Field>
              <Field label="Loại xe">
                <select
                  className="aw-input" value={form.vehicleType}
                  onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  style={{ height: 38 }} required
                >
                  {vehicleTypes.map((vt) => (
                    <option key={vt.vehicleTypeId} value={vt.name}>{vt.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Hãng xe (tuỳ chọn)">
                <input
                  className="aw-input" value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Honda, Yamaha…" style={{ height: 38 }}
                />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="aw-btn aw-btn-primary aw-btn-sm" disabled={saving}>
                <Icons.Check size={13} sw={2.5} /> {saving ? 'Đang lưu…' : 'Lưu xe'}
              </button>
              <button type="button" className="aw-btn aw-btn-ghost aw-btn-sm" onClick={() => { setShowForm(false); setForm(blankForm) }}>Huỷ</button>
            </div>
          </form>
        )}

        {loading ? (
          <EmptyState title="Đang tải danh sách xe…" />
        ) : vehicles.length === 0 ? (
          <EmptyState title="Chưa có xe nào được đăng ký">
            <button className="aw-btn aw-btn-primary aw-btn-sm" style={{ marginTop: 10 }} onClick={() => setShowForm(true)}>
              <Icons.Plus size={13} /> Thêm xe đầu tiên
            </button>
          </EmptyState>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 12 }}>
            {vehicles.map((v) => (
              <div key={v.vehicleId} className="aw-card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Bike size={18} stroke="var(--primary-ink)" />
                  </div>
                  <button
                    className="aw-btn aw-btn-ghost aw-btn-sm"
                    style={{ color: 'var(--danger)', fontSize: 11 }}
                    disabled={deletingId === v.vehicleId}
                    onClick={() => doDelete(v.vehicleId)}
                  >
                    <Icons.Trash size={12} /> {deletingId === v.vehicleId ? 'Đang xoá…' : 'Xoá'}
                  </button>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Geist Mono',monospace", marginBottom: 4 }}>{v.licensePlate}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 2 }}>{v.vehicleType}{v.brand ? ` · ${v.brand}` : ''}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 6 }}>Thêm vào: {formatDate(v.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </CustomerShell>
  )
}
