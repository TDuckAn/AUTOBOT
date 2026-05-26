import { useEffect, useMemo, useState } from 'react'
import { createWalkInBooking } from '../../api/bookings.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { listPricing, listServices } from '../../api/services.js'
import { Icons } from '../../components/icons.jsx'
import { StaffShell } from '../../components/layout/StaffShell.jsx'
import { Field } from '../../components/ui.jsx'
import { formatVND, toLocalDateTimeValue } from '../../utils/format.js'

export function StaffWalkin() {
  const [phone, setPhone] = useState('')
  const [plate, setPlate] = useState('')
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTimeValue(new Date()))
  const [services, setServices] = useState([])
  const [pricingByService, setPricingByService] = useState({})
  const [pricingId, setPricingId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listServices()
      .then(async (data) => {
        const rows = unwrapPaged(data)
        setServices(rows)
        const pairs = await Promise.all(rows.map(async (service) => [service.serviceId, unwrapPaged(await listPricing(service.serviceId))]))
        const map = Object.fromEntries(pairs)
        setPricingByService(map)
        const firstPricing = pairs.flatMap(([, prices]) => prices)[0]
        setPricingId(firstPricing?.pricingId ?? '')
      })
      .catch((err) => setError(getApiError(err, 'Không tải được dịch vụ.')))
  }, [])

  const options = useMemo(() => services.flatMap((service) => (pricingByService[service.serviceId] ?? []).map((price) => ({ service, price }))), [services, pricingByService])
  const selected = options.find((option) => option.price.pricingId === pricingId)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const data = await createWalkInBooking({
        walkinPhone: phone,
        walkinLicensePlate: plate,
        scheduledAt: new Date(scheduledAt).toISOString(),
        pricingId,
      })
      setMessage(`Đặt thành công - ${data.bookingId.slice(0, 8)}`)
      setPhone('')
      setPlate('')
      setScheduledAt(toLocalDateTimeValue(new Date()))
    } catch (err) {
      setError(getApiError(err, 'Không thể tạo booking vãng lai.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <StaffShell active="walkin" title="Khách vãng lai">
      <form onSubmit={submit} style={{ display: 'flex', height: '100%' }}>
        <div className="aw-scroll" style={{ flex: 1, padding: '20px 22px' }}>
          <StepHeader n="1" title="Khách hàng" sub="Nhập thông tin liên hệ" />
          <div className="aw-card" style={{ padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="Số điện thoại"><input className="aw-input" value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
              <Field label="Biển số xe"><input className="aw-input" value={plate} onChange={(e) => setPlate(e.target.value)} required style={{ fontFamily: "'Geist Mono',monospace" }} /></Field>
              <Field label="Thời gian"><input className="aw-input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required /></Field>
            </div>
          </div>

          <StepHeader n="2" title="Dịch vụ" sub="Chọn một bảng giá đang hoạt động" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {options.map(({ service, price }) => {
              const checked = pricingId === price.pricingId
              return (
                <label key={price.pricingId} className="aw-card" style={{
                  padding: '12px 14px', cursor: 'pointer', borderColor: checked ? 'var(--primary)' : 'var(--border)',
                  background: checked ? 'var(--primary-soft)' : 'var(--surface)',
                }}>
                  <input type="radio" name="pricing" checked={checked} onChange={() => setPricingId(price.pricingId)} style={{ position: 'absolute', opacity: 0 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{service.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{price.vehicleType} · {price.durationMinutes} phút</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-ink)', fontFamily: "'Geist Mono',monospace" }}>{formatVND(price.price)}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <aside style={{ width: 300, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Hoá đơn</div>
          </div>
          <div className="aw-scroll" style={{ flex: 1, padding: '14px 18px' }}>
            {selected ? (
              <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', fontSize: 12 }}>
                  <span>{selected.service.name}</span>
                  <span style={{ fontWeight: 600, fontFamily: "'Geist Mono',monospace" }}>{formatVND(selected.price.price)}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--ink-400)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Chưa chọn dịch vụ</div>
            )}
            {message && <div style={{ marginTop: 12, color: 'var(--green-ink)', fontSize: 13, fontWeight: 700 }}>{message}</div>}
            {error && <div style={{ marginTop: 12, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          </div>
          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Tổng cộng</span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(selected?.price.price ?? 0)}</span>
            </div>
            <button className="aw-btn aw-btn-primary" disabled={loading || !pricingId} style={{ width: '100%', height: 40, fontSize: 13, fontWeight: 600 }}>
              <Icons.Plus size={14} sw={2.5} /> Tạo lịch & In hoá đơn
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
