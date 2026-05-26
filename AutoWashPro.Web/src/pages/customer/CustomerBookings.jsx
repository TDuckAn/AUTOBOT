import { useEffect, useMemo, useState } from 'react'
import { cancelBooking, createBooking, getAvailability, getMyBookings, getVehicles } from '../../api/customer.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { listPricing, listServices } from '../../api/services.js'
import { StatusPill } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { CustomerShell } from '../../components/layout/CustomerShell.jsx'
import { EmptyState, Field, PageContainer } from '../../components/ui.jsx'
import { formatDate, formatTime, formatVND } from '../../utils/format.js'

const TODAY = new Date().toISOString().slice(0, 10)

export function CustomerBookings() {
  const [view, setView] = useState('list')  // 'list' | 'new'
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // New booking form state
  const [services, setServices] = useState([])
  const [pricingByService, setPricingByService] = useState({})
  const [pricingId, setPricingId] = useState('')
  const [date, setDate] = useState(TODAY)
  const [slots, setSlots] = useState([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadBookings = async () => {
    setLoading(true)
    try {
      const data = await getMyBookings({ pageSize: 50 })
      setBookings(unwrapPaged(data).sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)))
    } catch (err) {
      setError(getApiError(err, 'Không tải được lịch đặt.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Wrap state updates to avoid cascading renders
    Promise.resolve().then(() => {
      loadBookings()
      // Load services + pricing for new booking form
      listServices()
        .then(async (data) => {
          const rows = unwrapPaged(data).filter((s) => s.isActive)
          setServices(rows)
          const pairs = await Promise.all(rows.map(async (s) => [s.serviceId, unwrapPaged(await listPricing(s.serviceId)).filter((p) => p.isActive)]))
          const map = Object.fromEntries(pairs)
          setPricingByService(map)
          const first = pairs.flatMap(([, ps]) => ps)[0]
          if (first) setPricingId(first.pricingId)
        })
        .catch(() => {})
      // Load customer's vehicles
      getVehicles()
        .then((d) => {
          const vs = unwrapPaged(d)
          setVehicles(vs)
          if (vs[0]) setVehicleId(vs[0].vehicleId)
        })
        .catch(() => {})
    })
  }, [])

  // Load availability slots when pricingId or date changes
  useEffect(() => {
    if (!pricingId || !date) return
    // Avoid synchronous setState inside effect to prevent cascading renders
    Promise.resolve().then(() => {
      setSlotsLoading(true)
      setSlots([])
      setScheduledAt('')
    })

    getAvailability(date, pricingId)
      .then((data) => {
        const allSlots = Array.isArray(data) ? data : data?.slots ?? []
        setSlots(allSlots)
        const firstSelectable = allSlots.find((s) => s.isAvailable && new Date(s.scheduledAt) >= new Date())
        if (firstSelectable) setScheduledAt(firstSelectable.scheduledAt)
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [pricingId, date])

  const pricingOptions = useMemo(
    () => services.flatMap((s) => (pricingByService[s.serviceId] ?? []).map((p) => ({ service: s, pricing: p }))),
    [services, pricingByService],
  )
  const selectedPricing = pricingOptions.find((o) => o.pricing.pricingId === pricingId)

  const submitNew = async (e) => {
    e.preventDefault()
    if (!vehicleId) { setError('Vui lòng thêm xe trước khi đặt lịch.'); return }
    if (!scheduledAt) { setError('Vui lòng chọn giờ hẹn.'); return }
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await createBooking({ vehicleId, pricingId, scheduledAt: new Date(scheduledAt).toISOString() })
      setMessage('Đặt lịch thành công!')
      setView('list')
      await loadBookings()
    } catch (err) {
      setError(getApiError(err, 'Không thể đặt lịch.'))
    } finally {
      setSubmitting(false)
    }
  }

  const doCancel = async (id) => {
    setError('')
    setMessage('')
    try {
      await cancelBooking(id)
      setMessage('Đã huỷ lịch.')
      setBookings((prev) => prev.map((b) => b.bookingId === id ? { ...b, status: 'Cancelled' } : b))
    } catch (err) {
      setError(getApiError(err, 'Không thể huỷ lịch.'))
    }
  }

  return (
    <CustomerShell
      active="bookings" title={view === 'new' ? 'Đặt lịch mới' : 'Lịch đặt'}
      headerActions={
        view === 'list'
          ? <button className="aw-btn aw-btn-primary aw-btn-sm" onClick={() => { setView('new'); setError(''); setMessage('') }}><Icons.Plus size={13} sw={2.5} /> Đặt lịch mới</button>
          : <button className="aw-btn aw-btn-ghost aw-btn-sm" onClick={() => setView('list')}><Icons.ChevronRight size={13} style={{ transform: 'rotate(180deg)' }} /> Quay lại</button>
      }
    >
      {view === 'list' ? (
        <PageContainer>
          {(error || message) && (
            <div style={{ marginBottom: 14, fontSize: 13, color: error ? 'var(--danger)' : 'var(--green-ink)', padding: '9px 12px', borderRadius: 6, background: error ? 'var(--danger-soft)' : 'var(--green-soft)' }}>
              {error || message}
            </div>
          )}
          {loading ? (
            <EmptyState title="Đang tải lịch đặt…" />
          ) : bookings.length === 0 ? (
            <EmptyState title="Chưa có lịch đặt nào">
              <button className="aw-btn aw-btn-primary aw-btn-sm" style={{ marginTop: 10 }} onClick={() => setView('new')}>Đặt lịch ngay</button>
            </EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bookings.map((b) => (
                <div key={b.bookingId} className="aw-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 64 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatTime(b.scheduledAt)}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 1 }}>{formatDate(b.scheduledAt)}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{b.serviceName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 2 }}>{b.vehicleType}</div>
                    {b.pointsEarned > 0 && <div style={{ fontSize: 11, color: 'var(--green-ink)', marginTop: 2 }}>+{b.pointsEarned} điểm</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(b.finalPrice)}</div>
                    <StatusPill status={b.status?.toLowerCase()} />
                    {b.status === 'Confirmed' && (
                      <button
                        className="aw-btn aw-btn-ghost aw-btn-sm"
                        style={{ fontSize: 11, color: 'var(--danger)' }}
                        onClick={() => doCancel(b.bookingId)}
                      >
                        <Icons.Trash size={11} /> Huỷ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageContainer>
      ) : (
        <form onSubmit={submitNew} style={{ display: 'flex', height: '100%' }}>
          <div className="aw-scroll" style={{ flex: 1, padding: 'clamp(20px, 2vw, 34px)' }}>
            {error && (
              <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--danger)', padding: '9px 12px', borderRadius: 6, background: 'var(--danger-soft)', border: '1px solid oklch(56% 0.20 25 / 18%)' }}>
                {error}
              </div>
            )}

            <SectionHeader n="1" title="Xe của bạn" sub="Chọn xe để đặt lịch" />
            {vehicles.length === 0 ? (
              <div className="aw-card" style={{ padding: 16, marginBottom: 20, color: 'var(--ink-500)', fontSize: 13 }}>
                Bạn chưa có xe nào. <a href="/customer/vehicles" style={{ color: 'var(--primary-ink)' }}>Thêm xe →</a>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 10, marginBottom: 20 }}>
                {vehicles.map((v) => {
                  const checked = vehicleId === v.vehicleId
                  return (
                    <label key={v.vehicleId} className="aw-card" style={{ padding: '12px 14px', cursor: 'pointer', borderColor: checked ? 'var(--primary)' : 'var(--border)', background: checked ? 'var(--primary-soft)' : 'var(--surface)' }}>
                      <input type="radio" name="vehicle" checked={checked} onChange={() => setVehicleId(v.vehicleId)} style={{ position: 'absolute', opacity: 0 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Geist Mono',monospace" }}>{v.licensePlate}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 3 }}>{v.vehicleType}{v.brand ? ` · ${v.brand}` : ''}</div>
                    </label>
                  )
                })}
              </div>
            )}

            <SectionHeader n="2" title="Dịch vụ" sub="Chọn gói rửa xe" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 10, marginBottom: 20 }}>
              {pricingOptions.map(({ service, pricing }) => {
                const checked = pricingId === pricing.pricingId
                return (
                  <label key={pricing.pricingId} className="aw-card" style={{ padding: '12px 14px', cursor: 'pointer', borderColor: checked ? 'var(--primary)' : 'var(--border)', background: checked ? 'var(--primary-soft)' : 'var(--surface)' }}>
                    <input type="radio" name="pricing" checked={checked} onChange={() => setPricingId(pricing.pricingId)} style={{ position: 'absolute', opacity: 0 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{service.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 2 }}>{pricing.vehicleType} · {pricing.durationMinutes} phút</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-ink)', fontFamily: "'Geist Mono',monospace" }}>{formatVND(pricing.price)}</div>
                    </div>
                  </label>
                )
              })}
            </div>

            <SectionHeader n="3" title="Ngày & giờ" sub="Chọn ngày và giờ còn trống" />
            <div className="aw-card" style={{ padding: '14px 16px', marginBottom: 20 }}>
              <Field label="Ngày hẹn">
                <input
                  className="aw-input" type="date" value={date}
                  min={TODAY} onChange={(e) => setDate(e.target.value)}
                  style={{ maxWidth: 200, height: 38 }} required
                />
              </Field>
              {slotsLoading && <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 10 }}>Đang kiểm tra slot…</div>}
              {!slotsLoading && slots.length === 0 && pricingId && (
                <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 10 }}>Không còn slot trống trong ngày này.</div>
              )}
              {slots.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', marginBottom: 8 }}>KHUNG GIỜ</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {slots.map((slot) => {
                      const isPast = new Date(slot.scheduledAt) < new Date()
                      const isFull = !slot.isAvailable || slot.remainingCapacity === 0
                      const isUnavailable = isPast || isFull
                      const checked = scheduledAt === slot.scheduledAt
                      return (
                        <button
                          key={slot.scheduledAt} type="button"
                          disabled={isUnavailable}
                          onClick={() => setScheduledAt(slot.scheduledAt)}
                          style={{
                            padding: '6px 14px', borderRadius: 6,
                            border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                            background: checked ? 'var(--primary-soft)' : isUnavailable ? 'var(--surface-2)' : 'var(--surface)',
                            color: checked ? 'var(--primary-ink)' : isUnavailable ? 'var(--ink-300)' : 'var(--ink-700)',
                            opacity: isUnavailable ? 0.55 : 1,
                            fontSize: 12, fontWeight: checked ? 700 : 500,
                            cursor: isUnavailable ? 'not-allowed' : 'pointer',
                            fontFamily: "'Geist Mono',monospace",
                          }}
                        >
                          {formatTime(slot.scheduledAt)}
                          {!isUnavailable && <span style={{ fontSize: 10, color: 'var(--ink-400)', marginLeft: 4 }}>({slot.remainingCapacity})</span>}
                          {isFull && !isPast && <span style={{ fontSize: 10, color: 'var(--danger)', marginLeft: 4 }}>Hết</span>}
                          {isPast && <span style={{ fontSize: 10, color: 'var(--ink-400)', marginLeft: 4 }}>Qua rồi</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bill sidebar */}
          <aside style={{ width: 'clamp(320px, 24vw, 440px)', flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Hoá đơn xác nhận</div>
            </div>
            <div className="aw-scroll" style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedPricing ? (
                <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', fontSize: 12 }}>
                  {[
                    ['Dịch vụ', selectedPricing.service.name],
                    ['Loại xe', selectedPricing.pricing.vehicleType],
                    ['Thời gian', `${selectedPricing.pricing.durationMinutes} phút`],
                    ['Xe', vehicles.find((v) => v.vehicleId === vehicleId)?.licensePlate ?? '—'],
                    ['Giờ hẹn', scheduledAt ? formatTime(scheduledAt) : '—'],
                    ['Ngày', date ? new Date(date).toLocaleDateString('vi-VN') : '—'],
                  ].map(([label, value], i, arr) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: i < arr.length - 1 ? '1px solid var(--surface-3)' : 'none' }}>
                      <span style={{ color: 'var(--ink-500)' }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--ink-400)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Chưa chọn dịch vụ</div>
              )}
            </div>
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Tổng cộng</span>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>
                  {formatVND(selectedPricing?.pricing.price ?? 0)}
                </span>
              </div>
              <button
                className="aw-btn aw-btn-primary"
                disabled={submitting || !pricingId || !scheduledAt || !vehicleId}
                style={{ width: '100%', height: 40, fontSize: 13, fontWeight: 600 }}
              >
                <Icons.Check size={14} sw={2.5} /> {submitting ? 'Đang đặt…' : 'Xác nhận đặt lịch'}
              </button>
            </div>
          </aside>
        </form>
      )}
    </CustomerShell>
  )
}

function SectionHeader({ n, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--ink-500)' }}>{sub}</span>}
    </div>
  )
}
