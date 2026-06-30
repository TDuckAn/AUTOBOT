import { useEffect, useMemo, useState } from 'react'
import { cancelBooking, createBooking, getAvailability, getLoyalty, getMyBookings, getVehicles } from '../../api/customer.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { listPricing, listServices } from '../../api/services.js'
import { StatusPill } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { CustomerShell } from '../../components/layout/CustomerShell.jsx'
import { EmptyState, Field, PageContainer } from '../../components/ui.jsx'
import { addLocalDaysIso, formatDate, formatTime, formatVND, toLocalDateIso } from '../../utils/format.js'

const TODAY = toLocalDateIso()

export function CustomerBookings() {
  const [view, setView] = useState('list')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [services, setServices] = useState([])
  const [pricingByService, setPricingByService] = useState({})
  const [pricingId, setPricingId] = useState('')
  const [date, setDate] = useState(TODAY)
  const [slots, setSlots] = useState([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [bookingWindowDays, setBookingWindowDays] = useState(0)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

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
    Promise.resolve().then(() => {
      loadBookings()

      listServices()
        .then(async (data) => {
          const rows = unwrapPaged(data).filter((service) => service.isActive)
          setServices(rows)
          const pairs = await Promise.all(
            rows.map(async (service) => [
              service.serviceId,
              unwrapPaged(await listPricing(service.serviceId)).filter((pricing) => pricing.isActive),
            ]),
          )
          setPricingByService(Object.fromEntries(pairs))
        })
        .catch(() => {})

      getVehicles()
        .then((data) => {
          const rows = unwrapPaged(data)
          setVehicles(rows)
          if (rows[0]) {
            setVehicleId(rows[0].vehicleId)
          }
        })
        .catch(() => {})

      getLoyalty()
        .then((data) => setBookingWindowDays(Math.max(0, Number(data?.bookingWindowDays ?? 0))))
        .catch(() => {})
    })
  }, [])

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.vehicleId === vehicleId) ?? null,
    [vehicleId, vehicles],
  )

  const maxBookingDate = useMemo(
    () => addLocalDaysIso(TODAY, bookingWindowDays),
    [bookingWindowDays],
  )

  const pricingOptions = useMemo(() => {
    if (!selectedVehicle) {
      return []
    }

    return services.flatMap((service) =>
      (pricingByService[service.serviceId] ?? [])
        .filter((pricing) => pricing.vehicleTypeId === selectedVehicle.vehicleTypeId)
        .map((pricing) => ({ service, pricing })),
    )
  }, [pricingByService, selectedVehicle, services])

  useEffect(() => {
    if (date > maxBookingDate) {
      setDate(maxBookingDate)
    }
  }, [date, maxBookingDate])

  useEffect(() => {
    if (pricingOptions.length === 0) {
      setPricingId('')
      setSlots([])
      setScheduledAt('')
      return
    }

    if (!pricingOptions.some((option) => option.pricing.pricingId === pricingId)) {
      setPricingId(pricingOptions[0].pricing.pricingId)
    }
  }, [pricingId, pricingOptions])

  useEffect(() => {
    if (!pricingId || !date) return

    Promise.resolve().then(() => {
      setSlotsLoading(true)
      setSlots([])
      setScheduledAt('')
    })

    getAvailability(date, pricingId)
      .then((data) => {
        const allSlots = Array.isArray(data) ? data : data?.slots ?? []
        setSlots(allSlots)
        const firstSelectable = allSlots.find((slot) => slot.isAvailable && new Date(slot.scheduledAt) >= new Date())
        if (firstSelectable) {
          setScheduledAt(firstSelectable.scheduledAt)
        }
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [pricingId, date])

  const selectedPricing = pricingOptions.find((option) => option.pricing.pricingId === pricingId)
  const selectedServiceHighlights = extractServiceHighlightsForDisplay(selectedPricing?.service?.description)

  const handleDateChange = (value) => {
    if (!value) {
      setDate(TODAY)
      return
    }

    if (value < TODAY) {
      setDate(TODAY)
      return
    }

    if (value > maxBookingDate) {
      setDate(maxBookingDate)
      setError(`Bạn chỉ có thể đặt lịch đến ngày ${new Date(maxBookingDate).toLocaleDateString('vi-VN')}.`)
      return
    }

    setError('')
    setDate(value)
  }

  const submitNew = async (event) => {
    event.preventDefault()
    const scheduledDateIso = scheduledAt ? toLocalDateIso(new Date(scheduledAt)) : ''

    if (!vehicleId) {
      setError('Vui lòng thêm xe trước khi đặt lịch.')
      return
    }
    if (!pricingId) {
      setError('Không có gói dịch vụ phù hợp cho loại xe đã chọn.')
      return
    }
    if (!scheduledAt) {
      setError('Vui lòng chọn giờ hẹn.')
      return
    }
    if (scheduledDateIso && scheduledDateIso > maxBookingDate) {
      setError(`Bạn chỉ có thể đặt lịch đến ngày ${new Date(maxBookingDate).toLocaleDateString('vi-VN')}.`)
      setScheduledAt('')
      return
    }

    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await createBooking({ vehicleId, pricingId, scheduledAt })
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
    setCancelSubmitting(true)
    try {
      await cancelBooking(id)
      setMessage('Đã huỷ lịch.')
      setBookings((prev) => prev.map((booking) => (booking.bookingId === id ? { ...booking, status: 'Cancelled' } : booking)))
      setCancelTarget(null)
    } catch (err) {
      setError(getApiError(err, 'Không thể huỷ lịch.'))
    } finally {
      setCancelSubmitting(false)
    }
  }

  return (
    <CustomerShell
      active="bookings"
      title={view === 'new' ? 'Đặt lịch mới' : 'Lịch đặt'}
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
            <EmptyState title="Đang tải lịch đặt..." />
          ) : bookings.length === 0 ? (
            <EmptyState title="Chưa có lịch đặt nào">
              <button className="aw-btn aw-btn-primary aw-btn-sm" style={{ marginTop: 10 }} onClick={() => setView('new')}>Đặt lịch ngay</button>
            </EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bookings.map((booking) => (
                <div key={booking.bookingId} className="aw-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 64 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatTime(booking.scheduledAt)}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 1 }}>{formatDate(booking.scheduledAt)}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{booking.serviceName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 2 }}>{booking.vehicleTypeName}</div>
                    {booking.pointsEarned > 0 && <div style={{ fontSize: 11, color: 'var(--green-ink)', marginTop: 2 }}>+{booking.pointsEarned} điểm</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(booking.finalPrice)}</div>
                    <StatusPill status={booking.status?.toLowerCase()} />
                    {booking.status === 'Confirmed' && (
                      <button
                        className="aw-btn aw-btn-ghost aw-btn-sm"
                        style={{ fontSize: 11, color: 'var(--danger)' }}
                        onClick={() => setCancelTarget(booking)}
                      >
                        <Icons.Trash size={11} /> Huỷ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <ConfirmCancelDialog
            booking={cancelTarget}
            submitting={cancelSubmitting}
            onClose={() => !cancelSubmitting && setCancelTarget(null)}
            onConfirm={() => cancelTarget && doCancel(cancelTarget.bookingId)}
          />
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
                Bạn chưa có xe nào. <a href="/customer/vehicles" style={{ color: 'var(--primary-ink)' }}>Thêm xe -&gt;</a>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 10, marginBottom: 20 }}>
                {vehicles.map((vehicle) => {
                  const checked = vehicleId === vehicle.vehicleId
                  return (
                    <label key={vehicle.vehicleId} className="aw-card" style={{ padding: '12px 14px', cursor: 'pointer', borderColor: checked ? 'var(--primary)' : 'var(--border)', background: checked ? 'var(--primary-soft)' : 'var(--surface)' }}>
                      <input type="radio" name="vehicle" checked={checked} onChange={() => setVehicleId(vehicle.vehicleId)} style={{ position: 'absolute', opacity: 0 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Geist Mono',monospace" }}>{vehicle.licensePlate}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 3 }}>{vehicle.vehicleTypeName}{vehicle.brand ? ` · ${vehicle.brand}` : ''}</div>
                    </label>
                  )
                })}
              </div>
            )}

            <SectionHeader n="2" title="Dịch vụ" sub={selectedVehicle ? `Gói cho ${selectedVehicle.vehicleTypeName}` : 'Chọn xe trước khi chọn gói'} />
            {selectedVehicle && pricingOptions.length === 0 ? (
              <div className="aw-card" style={{ padding: 16, marginBottom: 20, color: 'var(--ink-500)', fontSize: 13 }}>
                Chưa có gói dịch vụ nào dành cho loại xe <strong>{selectedVehicle.vehicleTypeName}</strong>.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 12, marginBottom: 20 }}>
                {pricingOptions.map(({ service, pricing }) => {
                  const checked = pricingId === pricing.pricingId
                  const serviceHighlights = extractServiceHighlightsForDisplay(service.description)
                  return (
                    <label
                      key={pricing.pricingId}
                      className="aw-card"
                      style={{
                        padding: '14px 15px',
                        cursor: 'pointer',
                        borderColor: checked ? 'var(--primary)' : 'var(--border)',
                        background: checked ? 'var(--primary-soft)' : 'var(--surface)',
                        boxShadow: checked ? '0 0 0 3px var(--primary-ring)' : 'none',
                      }}
                    >
                      <input type="radio" name="pricing" checked={checked} onChange={() => setPricingId(pricing.pricingId)} style={{ position: 'absolute', opacity: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35 }}>{service.name}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                              <MetaChip icon={<Icons.Bike size={11} />} label={pricing.vehicleTypeName} />
                              <MetaChip icon={<Icons.Clock size={11} />} label={`${pricing.durationMinutes} phút`} />
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 3 }}>{checked ? 'Đang chọn' : 'Giá gói'}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-ink)', fontFamily: "'Geist Mono',monospace" }}>{formatVND(pricing.price)}</div>
                          </div>
                        </div>

                        {service.description && (
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--ink-700)',
                              lineHeight: 1.55,
                              background: checked ? 'rgba(255,255,255,0.82)' : 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              padding: '9px 10px',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {service.description}
                          </div>
                        )}

                        {serviceHighlights.length > 0 && (
                          <div style={{ display: 'grid', gap: 6 }}>
                            {serviceHighlights.slice(0, 3).map((item) => (
                              <div
                                key={`${pricing.pricingId}-${item}`}
                                style={{
                                  display: 'flex',
                                  gap: 8,
                                  alignItems: 'flex-start',
                                  fontSize: 11,
                                  color: 'var(--ink-700)',
                                }}
                              >
                                <span style={{ color: 'var(--green)', lineHeight: 1.4 }}><Icons.Check size={11} sw={2.6} /></span>
                                <span style={{ lineHeight: 1.45 }}>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            <SectionHeader n="3" title="Ngày và giờ" sub="Chọn ngày và giờ còn trống" />
            <div className="aw-card" style={{ padding: '14px 16px', marginBottom: 20 }}>
              <Field label="Ngày hẹn">
                <input
                  className="aw-input"
                  type="date"
                  value={date}
                  min={TODAY}
                  max={maxBookingDate}
                  onChange={(event) => handleDateChange(event.target.value)}
                  style={{ maxWidth: 200, height: 38 }}
                  required
                />
              </Field>
              <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 8 }}>
                Bạn có thể đặt trước tối đa {bookingWindowDays} ngày theo hạng thành viên hiện tại.
              </div>
              {slotsLoading && <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 10 }}>Đang kiểm tra slot...</div>}
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
                          key={slot.scheduledAt}
                          type="button"
                          disabled={isUnavailable}
                          onClick={() => setScheduledAt(slot.scheduledAt)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                            background: checked ? 'var(--primary-soft)' : isUnavailable ? 'var(--surface-2)' : 'var(--surface)',
                            color: checked ? 'var(--primary-ink)' : isUnavailable ? 'var(--ink-300)' : 'var(--ink-700)',
                            opacity: isUnavailable ? 0.55 : 1,
                            fontSize: 12,
                            fontWeight: checked ? 700 : 500,
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
              <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 12 }}>
                Giờ nhận lịch cho khách hàng: 08:00 - 17:00.
              </div>
            </div>
          </div>

          <aside style={{ width: 'clamp(320px, 24vw, 440px)', flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Hoá đơn xác nhận</div>
            </div>
            <div className="aw-scroll" style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedPricing ? (
                <>
                  <div className="aw-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, background: 'linear-gradient(180deg, var(--primary-soft) 0%, var(--surface) 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-500)', marginBottom: 5 }}>Dịch vụ đã chọn</div>
                        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.35 }}>{selectedPricing.service.name}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 3 }}>Tạm tính</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-ink)', fontFamily: "'Geist Mono',monospace" }}>
                          {formatVND(selectedPricing.pricing.price)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <MetaChip icon={<Icons.Bike size={11} />} label={selectedPricing.pricing.vehicleTypeName} />
                      <MetaChip icon={<Icons.Clock size={11} />} label={`${selectedPricing.pricing.durationMinutes} phút`} />
                      <MetaChip icon={<Icons.Calendar size={11} />} label={date ? new Date(date).toLocaleDateString('vi-VN') : '-'} />
                    </div>

                    {selectedPricing.service.description && (
                      <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ink-700)', background: 'rgba(255,255,255,0.82)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 11px' }}>
                        {selectedPricing.service.description}
                      </div>
                    )}

                    {selectedServiceHighlights.length > 0 && (
                      <div style={{ display: 'grid', gap: 7 }}>
                        {selectedServiceHighlights.slice(0, 4).map((item) => (
                          <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--ink-700)' }}>
                            <span style={{ color: 'var(--green)', lineHeight: 1.4 }}><Icons.Check size={12} sw={2.6} /></span>
                            <span style={{ lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', fontSize: 12 }}>
                    {[
                      ['Xe', vehicles.find((vehicle) => vehicle.vehicleId === vehicleId)?.licensePlate ?? '-'],
                      ['Giờ hẹn', scheduledAt ? formatTime(scheduledAt) : '-'],
                      ['Ngày', date ? new Date(date).toLocaleDateString('vi-VN') : '-'],
                    ].map(([label, value], index, arr) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: index < arr.length - 1 ? '1px solid var(--surface-3)' : 'none' }}>
                        <span style={{ color: 'var(--ink-500)' }}>{label}</span>
                        <span style={{ fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </>
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
                <Icons.Check size={14} sw={2.5} /> {submitting ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
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

function MetaChip({ icon, label }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 9px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.86)',
        border: '1px solid var(--border)',
        color: 'var(--ink-700)',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      <span style={{ color: 'var(--primary-ink)', display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

function ConfirmCancelDialog({ booking, submitting, onClose, onConfirm }) {
  if (!booking) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 9, 11, 0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        className="aw-card"
        style={{
          width: 'min(460px, 100%)',
          padding: 18,
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              background: 'var(--danger-soft)',
              color: 'var(--danger)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icons.Trash size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Xác nhận huỷ lịch</div>
            <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 4, lineHeight: 1.5 }}>
              Bạn có chắc muốn huỷ lịch này không? Hành động này không thể hoàn tác.
            </div>
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: 'var(--surface-2)',
            padding: '12px 13px',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>{booking.serviceName}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <MetaChip icon={<Icons.Bike size={11} />} label={booking.vehicleTypeName} />
            <MetaChip icon={<Icons.Calendar size={11} />} label={formatDate(booking.scheduledAt)} />
            <MetaChip icon={<Icons.Clock size={11} />} label={formatTime(booking.scheduledAt)} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
            Chi phí: <span style={{ fontWeight: 700, color: 'var(--ink-900)' }}>{formatVND(booking.finalPrice)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            className="aw-btn aw-btn-ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Đóng
          </button>
          <button
            type="button"
            className="aw-btn aw-btn-danger"
            onClick={onConfirm}
            disabled={submitting}
          >
            <Icons.Trash size={13} />
            {submitting ? 'Đang huỷ...' : 'Xác nhận huỷ'}
          </button>
        </div>
      </div>
    </div>
  )
}

function extractServiceHighlights(description) {
  if (!description) {
    return []
  }

  const blocks = description
    .split(/\r?\n|[;•]+/g)
    .map((item) => item.trim())
    .filter(Boolean)

  if (blocks.length > 1) {
    return blocks.slice(0, 4)
  }

  return description
    .split(/,\s+/g)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4)
    .slice(0, 4)
}

function extractServiceHighlightsForDisplay(description) {
  const highlights = extractServiceHighlights(description)

  if (!description) {
    return highlights
  }

  const normalizedDescription = description.trim()
  if (highlights.length === 1 && highlights[0] === normalizedDescription) {
    return []
  }

  return highlights
}
