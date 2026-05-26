import { useEffect, useState } from 'react'
import { getLoyalty } from '../../api/customer.js'
import { getApiError } from '../../api/client.js'
import { listMyVouchers, listVoucherRules, redeemVoucher } from '../../api/vouchers.js'
import { Icons } from '../../components/icons.jsx'
import { CustomerShell } from '../../components/layout/CustomerShell.jsx'
import { PageContainer } from '../../components/ui.jsx'
import { formatDate, formatVND } from '../../utils/format.js'

const TIERS = [
  { name: 'Member', rank: 1, color: 'var(--tier-dong)', min: 'Tất cả thành viên', perks: ['Cửa sổ đặt lịch 7 ngày', '+5 điểm mỗi lần rửa'] },
  { name: 'Silver', rank: 2, color: 'var(--tier-bac)', min: '3 lần/tháng & 150K/tháng', perks: ['Cửa sổ đặt lịch 10 ngày', '+8 điểm mỗi lần rửa'] },
  { name: 'Gold', rank: 3, color: 'var(--tier-vang)', min: '6 lần/tháng & 300K/tháng', perks: ['Cửa sổ đặt lịch 12 ngày', '+12 điểm mỗi lần rửa', 'Ưu tiên đặt lịch'] },
  { name: 'Platinum', rank: 4, color: 'var(--tier-platinum)', min: '10 lần/tháng & 500K/tháng', perks: ['Cửa sổ đặt lịch 14 ngày', '+20 điểm mỗi lần rửa', 'Ưu tiên cao nhất', 'Phần thưởng tốt nhất'] },
]

export function CustomerRewards() {
  const [tab, setTab] = useState('redeem')   // 'redeem' | 'tiers'
  const [loyalty, setLoyalty] = useState(null)
  const [rules, setRules] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeemingId, setRedeemingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const [l, r, v] = await Promise.all([getLoyalty(), listVoucherRules(), listMyVouchers()])
      setLoyalty(l)
      setRules(r)
      setVouchers(v)
    } catch (err) {
      setError(getApiError(err, 'Không tải được dữ liệu.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { Promise.resolve().then(load) }, [])

  const redeem = async (rule) => {
    setError('')
    setMessage('')
    setRedeemingId(rule.voucherRuleId)
    try {
      const voucher = await redeemVoucher(rule.voucherRuleId)
      setMessage(`Đổi thành công! Mã voucher của bạn: ${voucher.code}`)
      await load()
    } catch (err) {
      setError(getApiError(err, 'Không thể đổi điểm.'))
    } finally {
      setRedeemingId(null)
    }
  }

  return (
    <CustomerShell active="rewards" title="Điểm & Ưu đãi">
      <PageContainer>
        {/* Points balance hero */}
        <div className="aw-card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, background: 'var(--primary)', borderColor: 'transparent' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Coins size={24} stroke="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Số dư điểm thưởng</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: "'Geist Mono',monospace", lineHeight: 1 }}>
              {loading ? '…' : (loyalty?.pointsBalance ?? 0).toLocaleString('vi-VN')}
              <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 6, opacity: 0.8 }}>điểm</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 2 }}>Hạng hiện tại</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{loyalty?.tierName ?? '—'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>1 điểm = 100₫</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          <TabBtn active={tab === 'redeem'} onClick={() => setTab('redeem')}>
            <Icons.Gift size={13} /> Đổi điểm lấy voucher
          </TabBtn>
          <TabBtn active={tab === 'tiers'} onClick={() => setTab('tiers')}>
            <Icons.Layers size={13} /> Ưu đãi hạng thành viên
          </TabBtn>
        </div>

        {(error || message) && (
          <div style={{
            marginBottom: 16, fontSize: 13, padding: '10px 14px', borderRadius: 6, fontWeight: 600,
            color: error ? 'var(--danger)' : 'var(--green-ink)',
            background: error ? 'var(--danger-soft)' : 'var(--green-soft)',
          }}>
            {error || message}
          </div>
        )}

        {tab === 'redeem' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
            {/* Voucher rules */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Các gói đổi điểm</div>
              {loading ? (
                <div style={{ color: 'var(--ink-400)', fontSize: 13 }}>Đang tải…</div>
              ) : rules.length === 0 ? (
                <div className="aw-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                  Chưa có gói đổi điểm nào. Hãy quay lại sau!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {rules.map((rule) => {
                    const canAfford = (loyalty?.pointsBalance ?? 0) >= rule.pointCost
                    const isRedeeming = redeemingId === rule.voucherRuleId
                    return (
                      <div key={rule.voucherRuleId} className="aw-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: 15, fontWeight: 800 }}>{rule.name}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-ink)', fontFamily: "'Geist Mono',monospace" }}>
                            {formatVND(rule.discountAmount)}
                          </div>
                        </div>
                        {rule.description && (
                          <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>{rule.description}</div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icons.Coins size={13} stroke="var(--gold-ink)" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: canAfford ? 'var(--ink-900)' : 'var(--danger)' }}>
                            {rule.pointCost.toLocaleString('vi-VN')} điểm
                          </span>
                          {!canAfford && (
                            <span style={{ fontSize: 11, color: 'var(--danger)' }}>
                              (thiếu {(rule.pointCost - (loyalty?.pointsBalance ?? 0)).toLocaleString('vi-VN')})
                            </span>
                          )}
                        </div>
                        <button
                          className={`aw-btn ${canAfford ? 'aw-btn-primary' : 'aw-btn-ghost'} aw-btn-sm`}
                          style={{ width: '100%' }}
                          disabled={!canAfford || isRedeeming}
                          onClick={() => redeem(rule)}
                        >
                          <Icons.Gift size={13} />
                          {isRedeeming ? 'Đang đổi…' : canAfford ? 'Đổi ngay' : 'Không đủ điểm'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* My vouchers */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Voucher của tôi</div>
              {vouchers.length === 0 ? (
                <div className="aw-card" style={{ padding: 20, textAlign: 'center', color: 'var(--ink-400)', fontSize: 13 }}>
                  Chưa có voucher nào.<br />Đổi điểm để nhận voucher!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {vouchers.map((v) => (
                    <div key={v.voucherId} className="aw-card" style={{ padding: '14px 16px', opacity: v.isUsed ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{v.ruleName}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-ink)', fontFamily: "'Geist Mono',monospace" }}>
                          {formatVND(v.discountAmount)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700, fontFamily: "'Geist Mono',monospace",
                          padding: '4px 10px', borderRadius: 6,
                          background: v.isUsed ? 'var(--surface-2)' : 'var(--primary-soft)',
                          color: v.isUsed ? 'var(--ink-400)' : 'var(--primary-ink)',
                          border: `1px solid ${v.isUsed ? 'var(--border)' : 'var(--primary)'}`,
                          letterSpacing: '0.08em',
                        }}>
                          {v.code}
                        </div>
                        <span style={{ fontSize: 11, color: v.isUsed ? 'var(--danger)' : 'var(--green-ink)', fontWeight: 600 }}>
                          {v.isUsed ? 'Đã dùng' : 'Chưa dùng'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--ink-400)', marginTop: 6 }}>
                        Đổi lúc {formatDate(v.redeemedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'tiers' && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Ưu đãi theo hạng thành viên</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {TIERS.map((tier) => {
                const isCurrentTier = loyalty?.tierName?.toLowerCase() === tier.name.toLowerCase()
                return (
                  <div key={tier.name} className="aw-card" style={{
                    padding: '18px 20px',
                    borderColor: isCurrentTier ? tier.color : 'var(--border)',
                    boxShadow: isCurrentTier ? `0 0 0 2px ${tier.color}22` : 'var(--shadow-xs)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <Icons.Star size={18} fill={tier.color} stroke={tier.color} />
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: tier.color }}>{tier.name}</div>
                        {isCurrentTier && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: tier.color, letterSpacing: '0.06em' }}>
                            HẠNG HIỆN TẠI
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginBottom: 10 }}>
                      Yêu cầu: {tier.min}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {tier.perks.map((perk) => (
                        <div key={perk} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                          <Icons.Check size={12} stroke={tier.color} sw={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--ink-700)' }}>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </PageContainer>
    </CustomerShell>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      height: 36, paddingInline: 16, border: 'none', background: 'transparent', cursor: 'pointer',
      fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
      color: active ? 'var(--ink-900)' : 'var(--ink-500)',
      borderBottom: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
      marginBottom: -1,
    }}>
      {children}
    </button>
  )
}
