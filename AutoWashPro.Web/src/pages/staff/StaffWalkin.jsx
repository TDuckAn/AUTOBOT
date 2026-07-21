import { useEffect, useMemo, useState } from 'react'
import { createWalkInBooking, getWalkInAvailability } from '../../api/bookings.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { listPricing, listServices } from '../../api/services.js'
import { listVehicleTypes } from '../../api/vehicleTypes.js'
import { Icons } from '../../components/icons.jsx'
import { StaffShell } from '../../components/layout/StaffShell.jsx'
import { Field } from '../../components/ui.jsx'
import { formatTime, formatVND } from '../../utils/format.js'

const todayIso = new Date().toISOString().slice(0, 10)

export function StaffWalkin() {
  const [phone, setPhone] = useState('')
  const [plate, setPlate] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState('')
  const [services, setServices] = useState([])
  const [pricingByService, setPricingByService] = useState({})
  const [pricingId, setPricingId] = useState('')
  const [slots, setSlots] = useState([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initError, setInitError] = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)

  useEffect(() => {
    Promise.all([listVehicleTypes(), listServices()])
      .then(async ([types, servData]) => {
        setVehicleTypes(types)
        if (types[0]) setSelectedVehicleTypeId(types[0].vehicleTypeId)

        const rows = unwrapPaged(servData)
        setServices(rows)
        const pairs = await Promise.all(
          rows.map(async (s) => [s.serviceId, unwrapPaged(await listPricing(s.serviceId))]),
        )
        setPricingByService(Object.fromEntries(pairs))
      })
      .catch((err) => setInitError(getApiError(err, 'Không tải được dữ liệu.')))
  }, [])

  const selectedVehicleTypeName = vehicleTypes.find((vt) => vt.vehicleTypeId === selectedVehicleTypeId)?.name ?? ''

  const options = useMemo(() => {
    if (!selectedVehicleTypeId) return []
    return services.flatMap((service) =>
      (pricingByService[service.serviceId] ?? [])
        .filter((p) => p.isActive && p.vehicleTypeId === selectedVehicleTypeId)
        .map((price) => ({ service, price })),
    )
  }, [services, pricingByService, selectedVehicleTypeId])

  useEffect(() => {
    Promise.resolve().then(() => setPricingId(options[0]?.price.pricingId ?? ''))
  }, [options])

  useEffect(() => {
    if (!pricingId) {
      setSlots([])
      setScheduledAt('')
      return
    }

    setSlotsLoading(true)
    getWalkInAvailability({ date: todayIso, pricingId })
      .then((data) => {
        const availableSlots = (data ?? []).filter((slot) => slot.isAvailable)
        setSlots(availableSlots)
        setScheduledAt((current) => availableSlots.some((slot) => slot.scheduledAt === current) ? current : (availableSlots[0]?.scheduledAt ?? ''))
      })
      .catch((err) => {
        setSlots([])
        setScheduledAt('')
        setMessage({ type: 'error', text: getApiError(err, 'Không tải được khung giờ trống.') })
      })
      .finally(() => setSlotsLoading(false))
  }, [pricingId])

  const selected = options.find((o) => o.price.pricingId === pricingId)
  const selectedSlot = slots.find((slot) => slot.scheduledAt === scheduledAt) ?? null

  const submit = async (event) => {
    event.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      const data = await createWalkInBooking({
        walkinPhone: phone,
        walkinLicensePlate: plate,
        pricingId,
        scheduledAt,
      })
      setMessage({ type: 'success', text: `Tạo đơn thành công · ${data.bookingId.slice(0, 8)}` })
      setPhone('')
      setPlate('')
      setScheduledAt('')
      const refreshed = await getWalkInAvailability({ date: todayIso, pricingId })
      const availableSlots = (refreshed ?? []).filter((slot) => slot.isAvailable)
      setSlots(availableSlots)
      setScheduledAt(availableSlots[0]?.scheduledAt ?? '')
    } catch (err) {
      setMessage({ type: 'error', text: getApiError(err, 'Không thể tạo booking vãng lai.') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <StaffShell active="walkin" title="Khách vãng lai">
      <form onSubmit={submit} style={{ display: 'flex', height: '100%' }}>
        <div className="aw-scroll" style={{ flex: 1, padding: 'clamp(20px, 2vw, 34px)' }}>
          {initError && <div style={{ marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>{initError}</div>}

          <StepHeader n="1" title="Thông tin khách" sub="Nhập số điện thoại và biển số xe" />
          <div className="aw-card" style={{ padding: 'clamp(14px, 1.2vw, 20px)', marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              <Field label="Số điện thoại">
                <input className="aw-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" required />
              </Field>
              <Field label="Biển số xe">
                <input className="aw-input" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="51G-123.45" required style={{ fontFamily: "'Geist Mono',monospace" }} />
              </Field>
            </div>
          </div>

          <StepHeader n="2" title="Loại xe" sub="Chọn loại xe để lọc dịch vụ phù hợp" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {vehicleTypes.map((vt) => {
              const checked = selectedVehicleTypeId === vt.vehicleTypeId
              return (
                <button
                  key={vt.vehicleTypeId}
                  type="button"
                  onClick={() => setSelectedVehicleTypeId(vt.vehicleTypeId)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: checked ? 700 : 500,
                    border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                    background: checked ? 'var(--primary-soft)' : 'var(--surface)',
                    color: checked ? 'var(--primary-ink)' : 'var(--ink-700)', cursor: 'pointer',
                  }}
                >
                  <Icons.Bike size={13} /> {vt.name}
                </button>
              )
            })}
          </div>

          <StepHeader n="3" title="Dịch vụ" sub={selectedVehicleTypeId ? `Dịch vụ dành cho ${selectedVehicleTypeName}` : 'Chọn loại xe trước'} />
          {options.length === 0 && selectedVehicleTypeId ? (
            <div className="aw-card" style={{ padding: 16, color: 'var(--ink-500)', fontSize: 13 }}>
              Không có dịch vụ nào cho loại xe này. Admin cần thêm bảng giá.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 18 }}>
              {options.map(({ service, price }) => {
                const checked = pricingId === price.pricingId
                return (
                  <label
                    key={price.pricingId}
                    className="aw-card"
                    style={{
                      padding: '12px 14px', cursor: 'pointer',
                      borderColor: checked ? 'var(--primary)' : 'var(--border)',
                      background: checked ? 'var(--primary-soft)' : 'var(--surface)',
                    }}
                  >
                    <input type="radio" name="pricing" checked={checked} onChange={() => setPricingId(price.pricingId)} style={{ position: 'absolute', opacity: 0 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{service.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{price.durationMinutes} phút</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-ink)', fontFamily: "'Geist Mono',monospace" }}>{formatVND(price.price)}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          <StepHeader n="4" title="Khung giờ hôm nay" sub="Staff tự chọn giờ phục vụ còn trống cho khách vãng lai" />
          <div className="aw-card" style={{ padding: 16 }}>
            {slotsLoading ? (
              <div style={{ color: 'var(--ink-500)', fontSize: 13 }}>Đang tải khung giờ trống…</div>
            ) : slots.length === 0 ? (
              <div style={{ color: 'var(--ink-500)', fontSize: 13 }}>Không còn khung giờ trống phù hợp trong hôm nay.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {slots.map((slot) => {
                  const checked = scheduledAt === slot.scheduledAt
                  return (
                    <button
                      key={slot.scheduledAt}
                      type="button"
                      onClick={() => setScheduledAt(slot.scheduledAt)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                        background: checked ? 'var(--primary-soft)' : 'var(--surface)',
                        color: checked ? 'var(--primary-ink)' : 'var(--ink-700)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatTime(slot.scheduledAt)}</div>
                      <div style={{ fontSize: 11, color: checked ? 'var(--primary-ink)' : 'var(--ink-500)', marginTop: 2 }}>
                        Còn {slot.remainingCapacity} chỗ
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <aside style={{ width: 'clamp(320px, 24vw, 430px)', flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Hóa đơn</div>
            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 3 }}>Staff chọn giờ phục vụ ngay trong hôm nay</div>
          </div>
          <div className="aw-scroll" style={{ flex: 1, padding: '14px 18px' }}>
            {selected ? (
              <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', fontSize: 12 }}>
                {[
                  ['Dịch vụ', selected.service.name],
                  ['Loại xe', selected.price.vehicleTypeName],
                  ['Thời lượng', `${selected.price.durationMinutes} phút`],
                  ['Giờ vào', selectedSlot ? formatTime(selectedSlot.scheduledAt) : '—'],
                  ['Giờ xong', selectedSlot ? formatTime(selectedSlot.expectedEndAt) : '—'],
                  ['Khách', phone || '—'],
                  ['Biển số', plate || '—'],
                ].map(([label, value], i, rows) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: i < rows.length - 1 ? '1px solid var(--surface-3)' : 'none' }}>
                    <span style={{ color: 'var(--ink-500)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--ink-400)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Chưa chọn dịch vụ</div>
            )}
            {message && (
              <div
                style={{
                  marginTop: 14, fontSize: 13, padding: '10px 12px', borderRadius: 6, fontWeight: 600,
                  color: message.type === 'success' ? 'var(--green-ink)' : 'var(--danger)',
                  background: message.type === 'success' ? 'var(--green-soft)' : 'var(--danger-soft)',
                }}
              >
                {message.text}
              </div>
            )}
          </div>
          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Tổng cộng</span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(selected?.price.price ?? 0)}</span>
            </div>
            <button
              className="aw-btn aw-btn-primary"
              disabled={loading || !pricingId || !phone || !plate || !scheduledAt}
              style={{ width: '100%', height: 40, fontSize: 13, fontWeight: 600 }}
            >
              <Icons.Plus size={14} sw={2.5} /> {loading ? 'Đang tạo…' : 'Tạo đơn ngay'}
            </button>
          </div>
        </aside>
      </form>
    </StaffShell>
  )
}

function StepHeader({ n, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{sub}</span>}
    </div>
  )
}
