import { useEffect, useMemo, useState } from 'react'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { listCustomers, updateCustomerTier } from '../../api/customers.js'
import { listTiers } from '../../api/tiers.js'
import { TierBadge } from '../../components/badges.jsx'
import { Icons } from '../../components/icons.jsx'
import { AdminShell } from '../../components/layout/AdminShell.jsx'
import { Td, Th } from '../../components/ui.jsx'

export function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [tiers, setTiers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [tierId, setTierId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    listTiers().then((data) => setTiers(unwrapPaged(data)))
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      listCustomers({ search: search || undefined })
        .then((data) => {
          const rows = unwrapPaged(data)
          setCustomers(rows)
          setSelectedId((current) => current ?? rows[0]?.customerId ?? null)
        })
        .catch((err) => setError(getApiError(err, 'Không tải được khách hàng.')))
    }, 300)
    return () => clearTimeout(handle)
  }, [search])

  // Sync tierId whenever the selected customer changes
  useEffect(() => {
    Promise.resolve().then(() => {
      const customer = customers.find((c) => c.customerId === selectedId)
      if (customer) setTierId(customer.tierId ?? '')
    })
  }, [selectedId, customers])

  const selected = useMemo(() => customers.find((customer) => customer.customerId === selectedId), [customers, selectedId])

  const applyTier = async () => {
    if (!selected || !tierId) return
    try {
      const updated = await updateCustomerTier(selected.customerId, tierId)
      setCustomers((rows) => rows.map((row) => row.customerId === updated.customerId ? updated : row))
      setMessage('Cập nhật thành công.')
    } catch (err) {
      setError(getApiError(err, 'Không cập nhật được hạng.'))
    }
  }

  return (
    <AdminShell active="customers" title="Khách hàng" subtitle={`· ${customers.length} thành viên`}
      headerActions={<button className="aw-btn aw-btn-ghost aw-btn-sm"><Icons.Receipt size={13} /> CSV</button>}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, padding: 24, minWidth: 0 }}>
          {(error || message) && <div style={{ marginBottom: 12, color: error ? 'var(--danger)' : 'var(--green-ink)', fontSize: 13 }}>{error || message}</div>}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Icons.Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-400)' }} />
              <input className="aw-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên hoặc số điện thoại..." style={{ paddingLeft: 30, height: 32, fontSize: 12 }} />
            </div>
          </div>
          <div className="aw-card" style={{ overflow: 'hidden' }}>
            <table className="aw-table">
              <thead><tr><Th>Khách hàng</Th><Th>SĐT</Th><Th>Hạng</Th><Th>Điểm</Th><Th>Ngày tạo</Th></tr></thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.customerId} onClick={() => { setSelectedId(customer.customerId); setTierId(customer.tierId) }} style={{ background: selectedId === customer.customerId ? 'var(--primary-soft)' : 'transparent', cursor: 'pointer' }}>
                    <Td><b>{customer.fullName}</b></Td>
                    <Td mono>{customer.phoneNumber}</Td>
                    <Td><TierBadge tier={customer.tierName} size="sm" /></Td>
                    <Td mono>{customer.pointsBalance.toLocaleString('vi-VN')}</Td>
                    <Td>{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside style={{ width: 320, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          {selected && (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'oklch(94% 0.025 210)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--primary-ink)' }}>{selected.fullName.split(' ').slice(-2).map((p) => p[0]).join('')}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-500)', fontFamily: "'Geist Mono',monospace", marginTop: 1 }}>{selected.phoneNumber}</div>
                  <div style={{ marginTop: 4 }}><TierBadge tier={selected.tierName} size="sm" /></div>
                </div>
              </div>
              <div className="aw-scroll" style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                  <Metric label="Điểm" value={selected.pointsBalance.toLocaleString('vi-VN')} />
                  <Metric label="Cập nhật" value={new Date(selected.updatedAt).toLocaleDateString('vi-VN')} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8 }}>Đổi hạng thủ công</div>
                  <select className="aw-input" value={tierId} onChange={(e) => setTierId(e.target.value)}>
                    {tiers.map((tier) => <option key={tier.tierId} value={tier.tierId}>{tier.tierName}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <button className="aw-btn aw-btn-ghost" style={{ flex: 1, height: 32, fontSize: 12 }} onClick={() => setTierId(selected.tierId)}>Huỷ</button>
                <button className="aw-btn aw-btn-primary" style={{ flex: 2, height: 32, fontSize: 12 }} onClick={applyTier}>Áp dụng</button>
              </div>
            </>
          )}
        </aside>
      </div>
    </AdminShell>
  )
}

function Metric({ label, value }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--ink-500)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Geist Mono',monospace" }}>{value}</div>
    </div>
  )
}
