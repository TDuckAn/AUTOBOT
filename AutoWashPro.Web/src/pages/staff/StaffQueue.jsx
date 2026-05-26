import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeBooking, getBookings } from '../../api/bookings.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { Icons } from '../../components/icons.jsx'
import { StaffShell } from '../../components/layout/StaffShell.jsx'
import { EmptyState } from '../../components/ui.jsx'
import { StatusPill } from '../../components/badges.jsx'
import { formatTime, formatVND, formatVNDShort } from '../../utils/format.js'

const TODAY = new Date().toISOString().slice(0, 10)

export function StaffQueue() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    // Load ALL of today's bookings (both Confirmed and Completed)
    getBookings({ date: TODAY, pageSize: 200 })
      .then((data) => {
        if (!alive) return
        const rows = unwrapPaged(data).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
        setBookings(rows)
        // Auto-select first pending item
        const first = rows.find((b) => b.status === 'Confirmed')
        setSelectedId(first?.bookingId ?? rows[0]?.bookingId ?? null)
      })
      .catch((err) => setError(getApiError(err, 'Không tải được hàng chờ.')))
      .finally(() => setLoading(false))
    return () => { alive = false }
  }, [])

  const pending = useMemo(() => bookings.filter((b) => b.status === 'Confirmed'), [bookings])
  const completed = useMemo(() => bookings.filter((b) => b.status === 'Completed'), [bookings])
  const completedRevenue = useMemo(
    () => completed.reduce((sum, b) => sum + Number(b.finalPrice ?? 0), 0),
    [completed],
  )

  const selected = useMemo(() => bookings.find((b) => b.bookingId === selectedId), [bookings, selectedId])

  const complete = async (booking) => {
    setError('')
    setMessage('')
    try {
      await completeBooking(booking.bookingId, 0)
      setBookings((cur) =>
        cur.map((b) =>
          b.bookingId === booking.bookingId
            ? { ...b, status: 'Completed', completedAt: new Date().toISOString() }
            : b,
        ),
      )
      // Move selection to next pending
      setSelectedId((cur) => {
        if (cur !== booking.bookingId) return cur
        const next = pending.find((b) => b.bookingId !== booking.bookingId)
        return next?.bookingId ?? null
      })
      setMessage('Hoàn tất!')
    } catch (err) {
      setError(getApiError(err, 'Không thể hoàn tất booking.'))
    }
  }

  return (
    <StaffShell active="queue" title="Hàng chờ hôm nay" queueCount={pending.length}
      headerRight={
        <button className="aw-btn aw-btn-primary aw-btn-sm" onClick={() => navigate('/staff/walkin')}>
          <Icons.Plus size={13} sw={2.5} /> Thêm vãng lai
        </button>
      }
    >
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            {[
              ['Tổng hôm nay', bookings.length, 'var(--ink-900)'],
              ['Đang chờ', pending.length, 'var(--gold)'],
              ['Hoàn tất', completed.length, 'var(--green)'],
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
            {!loading && bookings.length === 0 && <EmptyState title="Không có booking nào hôm nay" />}
            {bookings.map((booking) => {
              const isSelected = selectedId === booking.bookingId
              const isDone = booking.status !== 'Confirmed'
              return (
                <div key={booking.bookingId} onClick={() => setSelectedId(booking.bookingId)} style={{
                  display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)',
                  background: isSelected ? 'var(--primary-soft)' : isDone ? 'rgba(0,0,0,0.015)' : 'var(--surface)',
                  cursor: 'pointer', borderLeft: `3px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                  opacity: isDone ? 0.75 : 1,
                }}>
                  <div style={{ width: 72, flexShrink: 0, padding: '16px 12px', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatTime(booking.scheduledAt)}</div>
                  </div>
                  <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{booking.walkinPhone ?? 'Khách thành viên'}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-400)', fontFamily: "'Geist Mono',monospace" }}>{booking.bookingId.slice(0, 8)}</span>
                      <StatusPill status={booking.status === 'Confirmed' ? 'queued' : booking.status?.toLowerCase()} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-700)', fontWeight: 500 }}>{booking.serviceName}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 3, fontFamily: "'Geist Mono',monospace" }}>{booking.walkinLicensePlate ?? booking.vehicleType}</div>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(booking.finalPrice)}</div>
                    {booking.status === 'Confirmed' && (
                      <button className="aw-btn aw-btn-green aw-btn-sm" onClick={(e) => { e.stopPropagation(); complete(booking) }}>
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
                <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 1 }}>
                  {selected.bookingId.slice(0, 8)} · {formatTime(selected.scheduledAt)}
                </div>
              </div>
              <div className="aw-scroll" style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="aw-photo" style={{ height: 120 }}>{selected.walkinLicensePlate ?? selected.vehicleType}</div>
                <div style={{ borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {[
                    ['Dịch vụ', selected.serviceName],
                    ['Biển số / Loại xe', selected.walkinLicensePlate ?? selected.vehicleType],
                    ['Giờ vào', formatTime(selected.scheduledAt)],
                    ['Dự kiến xong', formatTime(selected.expectedEndAt)],
                    ['Trạng thái', selected.status === 'Confirmed' ? 'Đang chờ' : selected.status === 'Completed' ? 'Đã hoàn tất' : 'Đã huỷ'],
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
                {selected.status === 'Confirmed' && (
                  <button className="aw-btn aw-btn-green" style={{ width: '100%', height: 40, fontSize: 14, fontWeight: 600 }} onClick={() => complete(selected)}>
                    <Icons.Check size={15} sw={2.5} /> Hoàn tất & Thu tiền
                  </button>
                )}
                {selected.status === 'Completed' && (
                  <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--green-ink)', fontWeight: 600 }}>
                    <Icons.Check size={14} /> Đã hoàn tất
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </StaffShell>
  )
}
