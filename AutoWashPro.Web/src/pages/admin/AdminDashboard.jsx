import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { getQueue } from '../../api/bookings.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { getSummary, getTierReview } from '../../api/reports.js'
import { StatusPill } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { AdminShell } from '../../components/layout/AdminShell.jsx'
import { PageContainer, Td, Th } from '../../components/ui.jsx'
import { formatTime, formatVND } from '../../utils/format.js'

const pieColors = ['var(--tier-dong)', 'var(--tier-bac)', 'var(--tier-vang)', 'var(--tier-platinum)']

export function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [tiers, setTiers] = useState([])
  const [queue, setQueue] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getSummary(), getTierReview(), getQueue({ pageSize: 8 })])
      .then(([summaryData, tierData, queueData]) => {
        setSummary(summaryData)
        setTiers(tierData.tierDistribution ?? [])
        setQueue(unwrapPaged(queueData).slice(0, 8))
      })
      .catch((err) => setError(getApiError(err, 'Không tải được tổng quan.')))
  }, [])

  const revenueChart = summary?.revenueHistory ?? []

  return (
    <AdminShell active="dashboard" title="Tổng quan" subtitle={`· ${new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`}
      headerActions={<button className="aw-btn aw-btn-ghost aw-btn-sm"><Icons.Receipt size={13} /> Xuất báo cáo</button>}
    >
      <PageContainer>
        {error && <div style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <Stat label="Doanh thu hôm nay" value={formatVND(summary?.revenue ?? 0)} icon="Coins" accent="var(--primary)" />
          <Stat label="Lượt rửa hôm nay" value={summary?.dailyWashVolume ?? 0} icon="Receipt" accent="var(--green)" />
          <Stat label="Khách hoạt động" value={summary?.activeCustomers ?? 0} icon="Users" accent="var(--gold)" />
          <Stat label="Lấp đầy slot" value={`${Math.round(summary?.slotUtilisationPercent ?? 0)}%`} icon="TrendUp" accent="var(--primary)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>
          <div className="aw-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Doanh thu 7 ngày gần nhất</div>
            {revenueChart.length > 0 ? (
              <div style={{ flex: 1, minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChart}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => formatVND(value)} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                Chưa có dữ liệu doanh thu
              </div>
            )}
          </div>
          <div className="aw-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Phân bổ hạng thành viên</div>
            {tiers.length > 0 ? (
              <>
                <div style={{ height: 170 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tiers.map((t) => ({ name: t.tierName, value: t.customerCount }))}
                        dataKey="value" nameKey="name" innerRadius={46} outerRadius={70}
                      >
                        {tiers.map((_, index) => <Cell key={index} fill={pieColors[index % pieColors.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, paddingLeft: 8, marginTop: 10 }}>
                  {tiers.map((tier, index) => (
                    <span key={tier.tierId} style={{ color: pieColors[index % pieColors.length], display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: pieColors[index % pieColors.length], flexShrink: 0 }} />
                      {tier.tierName}: {tier.customerCount} khách
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>

        <div className="aw-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }}>Hàng chờ hôm nay</div>
          {queue.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>Không có booking nào trong hàng chờ</div>
          ) : (
            <table className="aw-table">
              <thead><tr><Th>Giờ</Th><Th>Khách</Th><Th>Dịch vụ</Th><Th>Trạng thái</Th><Th>Giá trị</Th></tr></thead>
              <tbody>
                {queue.map((booking) => (
                  <tr key={booking.bookingId}>
                    <Td mono>{formatTime(booking.scheduledAt)}</Td>
                    <Td>{booking.walkinPhone ?? 'Khách thành viên'}</Td>
                    <Td>{booking.serviceName}</Td>
                    <Td><StatusPill status={booking.status === 'Confirmed' ? 'queued' : booking.status?.toLowerCase()} /></Td>
                    <Td mono>{formatVND(booking.finalPrice)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageContainer>
    </AdminShell>
  )
}

function Stat({ label, value, icon, accent }) {
  const Icon = Icons[icon]
  return (
    <div className="aw-card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: `color-mix(in oklab, ${accent} 10%, white)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} stroke={accent} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{value}</div>
    </div>
  )
}
