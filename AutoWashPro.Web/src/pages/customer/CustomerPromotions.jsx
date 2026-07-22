import { useEffect, useState } from 'react'
import { getApiError, unwrapPaged } from '../../api/client.js'
import { getLoyalty } from '../../api/customer.js'
import { listMyPromotions } from '../../api/promotions.js'
import { Icons } from '../../components/icons.jsx'
import { CustomerShell } from '../../components/layout/CustomerShell.jsx'
import { PageContainer } from '../../components/ui.jsx'
import { formatDate, formatVND } from '../../utils/format.js'

export function CustomerPromotions() {
  const [loyalty, setLoyalty] = useState(null)
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getLoyalty(), listMyPromotions({ pageSize: 100 })])
      .then(([l, p]) => {
        setLoyalty(l)
        setPromotions(unwrapPaged(p))
      })
      .catch((err) => setError(getApiError(err, 'Không tải được khuyến mãi.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <CustomerShell active="promotions" title="Khuyến mãi của tôi">
      <PageContainer>
        {error && <div style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <div className="aw-card" style={{ padding: '20px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 75%, #0b1020 25%) 100%)', borderColor: 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Tag size={22} stroke="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', marginBottom: 4 }}>Ưu đãi dành cho hạng thành viên hiện tại</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{loyalty?.tierName ?? '—'}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#fff' }}>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Số ưu đãi khả dụng</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Geist Mono',monospace" }}>{loading ? '…' : promotions.length}</div>
          </div>
        </div>

        {loading ? (
          <div className="aw-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}>Đang tải khuyến mãi...</div>
        ) : promotions.length === 0 ? (
          <div className="aw-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)', fontSize: 13 }}>
            Hiện chưa có khuyến mãi nào phù hợp với hạng của bạn.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {promotions.map((promotion) => (
              <div key={promotion.promotionId} className="aw-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{promotion.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-500)', marginTop: 4 }}>{promotion.minTierName}{promotion.maxTierName ? ` - ${promotion.maxTierName}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Geist Mono',monospace", color: 'var(--primary-ink)', flexShrink: 0 }}>
                    {formatPromotionReward(promotion)}
                  </div>
                </div>

                {promotion.description && <div style={{ fontSize: 12, color: 'var(--ink-700)', lineHeight: 1.55 }}>{promotion.description}</div>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Badge label={promotion.rewardType} />
                  <Badge label={promotion.isStackable ? 'Stackable' : 'Không dùng kèm ưu đãi khác'} />
                  <Badge label={`${formatDate(promotion.startDate)} → ${formatDate(promotion.endDate)}`} />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 12, color: 'var(--ink-500)', display: 'grid', gap: 4 }}>
                  <div>Hạng tối thiểu: <b style={{ color: 'var(--ink-900)' }}>{promotion.minTierName}</b></div>
                  <div>Hiệu lực: <b style={{ color: 'var(--ink-900)' }}>{formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}</b></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </CustomerShell>
  )
}

function Badge({ label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 999,
      background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 10, fontWeight: 700,
      color: 'var(--ink-700)', letterSpacing: '0.03em',
    }}>
      {label}
    </span>
  )
}

function formatPromotionReward(promotion) {
  if (promotion.rewardType === 'FreeWash') {
    return 'Miễn phí'
  }

  if (promotion.rewardType === 'Discount') {
    return formatVND(promotion.rewardValue)
  }

  return `${Number(promotion.rewardValue).toLocaleString('vi-VN')} điểm`
}