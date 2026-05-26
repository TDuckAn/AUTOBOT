import { useEffect, useState } from 'react'
import { getLoyalty, getMyBookings, getNotifications, getProfile } from '../../api/customer.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { TierBadge } from '../../components/badges.jsx'
import { StatusPill } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { CustomerShell } from '../../components/layout/CustomerShell.jsx'
import { PageContainer } from '../../components/ui.jsx'
import { formatDate, formatTime, formatVND } from '../../utils/format.js'

export function CustomerDashboard() {
  const [profile, setProfile] = useState(null)
  const [loyalty, setLoyalty] = useState(null)
  const [bookings, setBookings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getProfile(), getLoyalty(), getMyBookings({ pageSize: 5 }), getNotifications({ pageSize: 5 })])
      .then(([p, l, b, n]) => {
        setProfile(p)
        setLoyalty(l)
        setBookings(unwrapPaged(b))
        setNotifications(unwrapPaged(n))
      })
      .catch((err) => setError(getApiError(err, 'Không tải được thông tin.')))
  }, [])

  return (
    <CustomerShell active="dashboard" title="Tổng quan">
      <PageContainer>
        {error && <div style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        {/* Profile + Loyalty hero */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginBottom: 20 }}>
          <div className="aw-card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color: '#fff',
              }}>
                {profile?.fullName?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{profile?.fullName ?? '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 2 }}>{profile?.phoneNumber}</div>
              </div>
              {profile && <div style={{ marginLeft: 'auto' }}><TierBadge tier={profile.tierName} size="md" /></div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <InfoBox label="Tham gia từ" value={formatDate(profile?.createdAt)} />
              <InfoBox label="Điểm tích luỹ" value={loyalty?.pointsBalance ?? '—'} accent="var(--primary)" mono />
            </div>
          </div>

          <div className="aw-card" style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Hạng thành viên</div>
            {loyalty ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <TierBadge tier={loyalty.tierName} size="lg" />
                  <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>Rank #{loyalty.tierRank}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <InfoBox label="Điểm / lần rửa" value={`+${loyalty.pointsPerWash}`} accent="var(--green)" mono />
                  <InfoBox label="Đặt trước" value={`${loyalty.bookingWindowDays} ngày`} mono />
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--ink-400)', fontSize: 13 }}>Đang tải…</div>
            )}
          </div>
        </div>

        {/* Points balance bar */}
        {loyalty && (
          <div className="aw-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <Icons.Coins size={22} stroke="var(--primary)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-500)', marginBottom: 3 }}>Số dư điểm thưởng</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Geist Mono',monospace", color: 'var(--primary-ink)' }}>
                {loyalty.pointsBalance.toLocaleString('vi-VN')} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-500)' }}>điểm</span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-500)', textAlign: 'right' }}>
              <div>1 điểm = 100₫</div>
              <div style={{ fontWeight: 700, color: 'var(--ink-900)', marginTop: 2 }}>
                ≈ {formatVND(loyalty.pointsBalance * 100)}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 0.65fr)', gap: 14 }}>
          {/* Recent bookings */}
          <div className="aw-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Lịch sử gần đây</span>
              <a href="/customer/bookings" style={{ fontSize: 12, color: 'var(--primary-ink)', textDecoration: 'none', fontWeight: 500 }}>Xem tất cả →</a>
            </div>
            {bookings.length === 0 ? (
              <div style={{ padding: 24, color: 'var(--ink-500)', fontSize: 13, textAlign: 'center' }}>Chưa có lịch đặt nào.</div>
            ) : (
              <div>
                {bookings.map((b) => (
                  <div key={b.bookingId} style={{ padding: '12px 18px', borderBottom: '1px solid var(--surface-3)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 52 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{formatTime(b.scheduledAt)}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-500)', marginTop: 1 }}>{formatDate(b.scheduledAt)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.serviceName}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 1 }}>{b.vehicleType}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Geist Mono',monospace" }}>{formatVND(b.finalPrice)}</div>
                      <div style={{ marginTop: 3 }}><StatusPill status={b.status?.toLowerCase()} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="aw-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Thông báo</span>
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, color: 'var(--ink-500)', fontSize: 13, textAlign: 'center' }}>Không có thông báo.</div>
            ) : (
              <div className="aw-scroll" style={{ maxHeight: 320 }}>
                {notifications.map((n) => (
                  <div key={n.notificationId} style={{ padding: '11px 16px', borderBottom: '1px solid var(--surface-3)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 4 }}>{formatDate(n.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </CustomerShell>
  )
}

function InfoBox({ label, value, accent, mono }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{
        fontSize: 16, fontWeight: 800, color: accent ?? 'var(--ink-900)',
        fontFamily: mono ? "'Geist Mono',monospace" : 'inherit',
      }}>{value}</div>
    </div>
  )
}
