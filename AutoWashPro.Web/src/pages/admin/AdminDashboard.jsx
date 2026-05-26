import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { getQueue } from '../../api/bookings.js'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { getSummary, getTierReview } from '../../api/reports.js'
import { StatusPill } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { AdminShell } from '../../components/layout/AdminShell.jsx'
import { PageContainer, Td, Th } from '../../components/ui.jsx'
import { formatTime, formatVND, formatVNDShort } from '../../utils/format.js'

const barFallback = [
  { day: 'T2', value: 1500000 }, { day: 'T3', value: 2100000 }, { day: 'T4', value: 1780000 },
  { day: 'T5', value: 2640000 }, { day: 'T6', value: 2400000 }, { day: 'T7', value: 3120000 }, { day: 'CN', value: 2250000 },
]
const pieColors = ['var(--tier-dong)', 'var(--tier-bac)', 'var(--tier-vang)', 'var(--tier-platinum)']

export function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [tiers, setTiers] = useState([])
  const [queue, setQueue] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getSummary(), getTierReview(), getQueue({ pageSize: 5 })])
      .then(([summaryData, tierData, queueData]) => {
        setSummary(summaryData)
        setTiers(tierData.tierDistribution ?? [])
        setQueue(unwrapPaged(queueData).slice(0, 5))
      })
      .catch((err) => setError(getApiError(err, 'Không tải được tổng quan.')))
  }, [])

  return (
    <AdminShell active="dashboard" title="Tổng quan" subtitle={`· ${new Date().toLocaleDateString('vi-VN')}`}
      headerActions={<button className="aw-btn aw-btn-ghost aw-btn-sm"><Icons.Receipt size={13} /> Xuất</button>}
    >
      <PageContainer>
        {error && <div style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <Stat label="Doanh thu hôm nay" value={formatVND(summary?.revenue ?? summary?.totalRevenue ?? 0)} icon="Coins" accent="var(--primary)" />
          <Stat label="Lượt rửa" value={summary?.dailyWashVolume ?? summary?.totalBookings ?? 0} icon="Receipt" accent="var(--green)" />
          <Stat label="Khách hoạt động" value={summary?.activeCustomers ?? 0} icon="Users" accent="var(--gold)" />
          <Stat label="Lấp đầy slot" value={`${summary?.slotUtilisationPercent ?? summary?.slotUtilisation ?? 0}%`} icon="TrendUp" accent="var(--primary)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 20 }}>
          <div className="aw-card" style={{ padding: 18, height: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Doanh thu 7 ngày</div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={summary?.revenueHistory ?? barFallback}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatVND(value)} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="aw-card" style={{ padding: 18, height: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Phân bổ hạng</div>
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie data={tiers.map((t) => ({ name: t.tierName, value: t.customerCount }))} dataKey="value" nameKey="name" innerRadius={46} outerRadius={72}>
                  {tiers.map((_, index) => <Cell key={index} fill={pieColors[index % pieColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gap: 5, fontSize: 12 }}>
              {tiers.map((tier, index) => <span key={tier.tierId} style={{ color: pieColors[index % pieColors.length] }}>{tier.tierName}: {tier.customerCount}</span>)}
            </div>
          </div>
        </div>

        <div className="aw-card" style={{ overflow: 'hidden' }}>
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
      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--green-ink)', fontWeight: 500 }}>↑ {formatVNDShort(120000)} so với tuần trước</div>
    </div>
  )
}
