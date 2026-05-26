import { useEffect, useState } from 'react'
import { getBookings } from '../../api/bookings.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { StatusPill } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { StaffShell } from '../../components/layout/StaffShell.jsx'
import { EmptyState } from '../../components/ui.jsx'
import { formatDate, formatTime, formatVND } from '../../utils/format.js'

const TODAY = new Date().toISOString().slice(0, 10)

export function StaffHistory() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [date, setDate] = useState(TODAY)

  const load = async (d) => {
    setLoading(true)
    setError('')
    try {
      const data = await getBookings({ date: d, pageSize: 100 })
      const rows = unwrapPaged(data)
        .filter((b) => b.status === 'Completed' || b.status === 'Cancelled')
        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
      setBookings(rows)
    } catch (err) {
      setError(getApiError(err, 'Không tải được lịch sử.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { Promise.resolve().then(() => load(date)) }, [date])

  const totalRevenue = bookings
    .filter((b) => b.status === 'Completed')
    .reduce((sum, b) => sum + Number(b.finalPrice ?? 0), 0)

  return (
    <StaffShell active="history" title="Danh sách đơn">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          {[
            ['Hoàn tất', bookings.filter((b) => b.status === 'Completed').length, 'var(--green)'],
            ['Đã huỷ', bookings.filter((b) => b.status === 'Cancelled').length, 'var(--danger)'],
            ['Doanh thu', formatVND(totalRevenue), 'var(--primary)'],
          ].map(([label, value, color]) => (
            <div key={label} style={{ padding: '12px 18px', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'Geist Mono',monospace" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Date filter */}
        <div style={{ padding: '12px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.Calendar size={14} stroke="var(--ink-400)" />
          <input
            type="date" className="aw-input" value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: 160, height: 32, fontSize: 13 }}
          />
          <span style={{ fontSize: 12, color: 'var(--ink-500)' }}>
            {bookings.length} đơn
          </span>
        </div>

        {/* List */}
        <div className="aw-scroll" style={{ flex: 1 }}>
          {loading && <EmptyState title="Đang tải danh sách…" />}
          {!loading && error && <div style={{ padding: 20, color: 'var(--danger)' }}>{error}</div>}
          {!loading && !error && bookings.length === 0 && (
            <EmptyState title="Không có đơn nào trong ngày này" />
          )}
          {bookings.map((b) => (
            <div key={b.bookingId} style={{
              display: 'flex', alignItems: 'center',
              borderBottom: '1px solid var(--border)', background: 'var(--surface)',
              padding: '0 0 0 0',
            }}>
              <div style={{ width: 72, flexShrink: 0, padding: '14px 12px', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatTime(b.scheduledAt)}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 2 }}>{formatDate(b.scheduledAt)}</div>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {b.walkinPhone ?? 'Khách thành viên'}
                  </span>
                  {b.walkinPhone && (
                    <span style={{ fontSize: 10, color: 'var(--ink-400)', fontFamily: "'Geist Mono',monospace" }}>
                      {b.walkinLicensePlate}
                    </span>
                  )}
                  <StatusPill status={b.status?.toLowerCase()} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-600)', fontWeight: 500 }}>{b.serviceName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', fontFamily: "'Geist Mono',monospace", marginTop: 2 }}>{b.vehicleType}</div>
              </div>
              <div style={{ padding: '12px 16px', textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatVND(b.finalPrice)}</div>
                {b.completedAt && (
                  <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 2 }}>
                    Hoàn tất lúc {formatTime(b.completedAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StaffShell>
  )
}
