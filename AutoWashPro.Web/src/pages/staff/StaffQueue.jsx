import { useEffect, useMemo, useState } from 'react'
import { completeBooking, getQueue } from '../../api/bookings.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { Icons } from '../../components/icons.jsx'
import { StaffShell } from '../../components/layout/StaffShell.jsx'
import { EmptyState } from '../../components/ui.jsx'
import { StatusPill } from '../../components/badges.jsx'
import { formatTime, formatVND, formatVNDShort } from '../../utils/format.js'

const statusFor = (status) => {
  if (status === 'Completed') return 'completed'
  if (status === 'Cancelled') return 'cancelled'
  return 'queued'
}

export function StaffQueue() {
  const [bookings, setBookings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getQueue()
      .then((data) => {
        if (!alive) return
        const rows = unwrapPaged(data).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
        setBookings(rows)
        setSelectedId(rows[0]?.bookingId ?? null)
      })
      .catch((err) => setError(getApiError(err, 'Không tải được hàng chờ.')))
      .finally(() => setLoading(false))
    return () => { alive = false }
  }, [])

  const selected = useMemo(() => bookings.find((booking) => booking.bookingId === selectedId), [bookings, selectedId])
  const completedRevenue = bookings.filter((booking) => booking.status === 'Completed').reduce((sum, booking) => sum + Number(booking.finalPrice ?? 0), 0)

  const complete = async (booking) => {
    setError('')
    setMessage('')
    try {
      await completeBooking(booking.bookingId, 0)
      setBookings((current) => current.filter((item) => item.bookingId !== booking.bookingId))
      setSelectedId((current) => {
        if (current !== booking.bookingId) return current
        return bookings.find((item) => item.bookingId !== booking.bookingId)?.bookingId ?? null
      })
      setMessage('Hoàn tất!')
    } catch (err) {
      setError(getApiError(err, 'Không thể hoàn tất booking.'))
    }
  }

  return (
    <StaffShell active="queue" title="Hàng chờ hôm nay" queueCount={bookings.length}
      headerRight={<button className="aw-btn aw-btn-primary aw-btn-sm"><Icons.Plus size={13} sw={2.5} /> Thêm</button>}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {[
              ['Tổng', bookings.length, 'var(--ink-900)'],
              ['Đang chờ', bookings.filter((b) => b.status === 'Confirmed').length, 'var(--gold)'],
              ['Hoàn tất', bookings.filter((b) => b.status === 'Completed').length, 'var(--green)'],
              ['Doanh thu', completedRevenue ? formatVNDShort(completedRevenue) + '₫' : '-', 'var(--primary)'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ padding: '12px 18px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'Geist Mono',monospace" }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="aw-scroll" style={{ flex: 1 }}>
            {loading && <EmptyState title="Đang tải hàng chờ" />}
            {!loading && bookings.length === 0 && <EmptyState title="Không còn booking trong hàng chờ" />}
            {bookings.map((booking) => {
              const selectedRow = selectedId === booking.bookingId
              return (
                <div key={booking.bookingId} onClick={() => setSelectedId(booking.bookingId)} style={{
                  display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)',
                  background: selectedRow ? 'var(--primary-soft)' : 'var(--surface)', cursor: 'pointer',
                  borderLeft: `3px solid ${selectedRow ? 'var(--primary)' : 'transparent'}`,
                }}>
                  <div style={{ width: 72, flexShrink: 0, padding: '16px 12px', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatTime(booking.scheduledAt)}</div>
                  </div>
                  <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{booking.walkinPhone ?? 'Khách thành viên'}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-400)', fontFamily: "'Geist Mono',monospace" }}>{booking.bookingId.slice(0, 8)}</span>
                      <StatusPill status={statusFor(booking.status)} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 500 }}>{booking.serviceName}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 3, fontFamily: "'Geist Mono',monospace" }}>{booking.walkinLicensePlate ?? booking.vehicleType}</div>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(booking.finalPrice)}</div>
                    {booking.status !== 'Completed' && (
                      <button className="aw-btn aw-btn-green aw-btn-sm" onClick={(event) => { event.stopPropagation(); complete(booking) }}>
                        <Icons.Check size={12} sw={2.5} /> Hoàn tất
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside style={{ width: 310, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <EmptyState title="Chọn một booking" />
          ) : (
            <>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Đơn đang chọn</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.walkinPhone ?? 'Khách thành viên'}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 1 }}>{selected.bookingId.slice(0, 8)} · {formatTime(selected.scheduledAt)}</div>
              </div>
              <div className="aw-scroll" style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="aw-photo" style={{ height: 120 }}>{selected.walkinLicensePlate ?? selected.vehicleType}</div>
                <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {[
                    ['Dịch vụ', selected.serviceName],
                    ['Biển số', selected.walkinLicensePlate ?? selected.vehicleType],
                    ['Giờ vào', formatTime(selected.scheduledAt)],
                    ['Dự kiến', formatTime(selected.expectedEndAt)],
                    ['Trạng thái', selected.status],
                  ].map(([label, value], i) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderBottom: i < 4 ? '1px solid var(--surface-3)' : 'none', fontSize: 12 }}>
                      <span style={{ color: 'var(--ink-500)' }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>
                {message && <div style={{ color: 'var(--green-ink)', fontSize: 13, fontWeight: 700 }}>{message}</div>}
                {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
              </div>
              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>Tổng thanh toán</span>
                  <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(selected.finalPrice)}</span>
                </div>
                <button className="aw-btn aw-btn-green" style={{ width: '100%', height: 40, fontSize: 14, fontWeight: 600 }} onClick={() => complete(selected)}>
                  <Icons.Check size={15} sw={2.5} /> Hoàn tất & Thu tiền
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </StaffShell>
  )
}
