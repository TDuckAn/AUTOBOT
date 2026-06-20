// shared.jsx — design tokens, icons, mock data, small primitives
// Loaded after React + Babel.

// ─── Icons (24px stroke) ──────────────────────────────────────────────
const Icon = ({ d, size = 20, stroke = 'currentColor', fill = 'none', sw = 1.6, vb = '0 0 24 24', children, style }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  Phone: (p) => <Icon {...p} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>,
  Lock: (p) => <Icon {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>,
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>,
  Home: (p) => <Icon {...p} d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Icon>,
  Gift: (p) => <Icon {...p}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C14.5 3 12 8 12 8"/></Icon>,
  Bike: (p) => <Icon {...p}><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-7h5l3 7M9 10l1-3h3M14 10l2-3h3"/></Icon>,
  ChevronRight: (p) => <Icon {...p} d="M9 6l6 6-6 6"/>,
  ChevronLeft: (p) => <Icon {...p} d="M15 6l-9 6 6 6"/>,
  Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14"/>,
  Check: (p) => <Icon {...p} d="M5 13l4 4L19 7"/>,
  Star: (p) => <Icon {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>,
  Sparkles: (p) => <Icon {...p}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9zM5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6z"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  MapPin: (p) => <Icon {...p}><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  CreditCard: (p) => <Icon {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></Icon>,
  Edit: (p) => <Icon {...p} d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Filter: (p) => <Icon {...p} d="M22 3H2l8 9.46V19l4 2v-8.54z"/>,
  Tag: (p) => <Icon {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/></Icon>,
  Coins: (p) => <Icon {...p}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88L15.69 14.9"/></Icon>,
  TrendUp: (p) => <Icon {...p} d="M3 17l6-6 4 4 8-8M14 7h7v7"/>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="4"/><path d="M1 21a8 8 0 0 1 16 0M17 11a4 4 0 0 0 0-8M23 21a8 8 0 0 0-6-7.74"/></Icon>,
  Receipt: (p) => <Icon {...p}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 2V2H4z"/><path d="M8 7h8M8 11h8M8 15h5"/></Icon>,
  LogOut: (p) => <Icon {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  Menu: (p) => <Icon {...p} d="M3 6h18M3 12h18M3 18h18"/>,
  X: (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12"/>,
  Eye: (p) => <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Droplet: (p) => <Icon {...p} d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>,
  ArrowRight: (p) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6"/>,
  ArrowLeft: (p) => <Icon {...p} d="M19 12H5M11 6l-6 6 6 6"/>,
  MoreVert: (p) => <Icon {...p}><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></Icon>,
  Wallet: (p) => <Icon {...p}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></Icon>,
  Send: (p) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>,
  Camera: (p) => <Icon {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Icon>,
  Dashboard: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></Icon>,
  Box: (p) => <Icon {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12l8.73-5.04M12 22V12"/></Icon>,
  Layers: (p) => <Icon {...p} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>,
  Sliders: (p) => <Icon {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></Icon>,
};

// ─── Mock data (Vietnamese motorbike wash context) ─────────────────────
const SERVICES = [
  { id: 's1', name: 'Rửa cơ bản',         desc: 'Rửa nhanh, lau khô',            price: 30000,  time: 15, popular: false },
  { id: 's2', name: 'Rửa kỹ + Lau bóng',  desc: 'Rửa toàn diện, lau bóng vỏ',    price: 50000,  time: 25, popular: true },
  { id: 's3', name: 'Rửa máy chuyên sâu', desc: 'Vệ sinh động cơ, dây xích',     price: 80000,  time: 40, popular: false },
  { id: 's4', name: 'Đánh bóng nhựa',     desc: 'Phục hồi nhựa, làm mới đèn',    price: 150000, time: 60, popular: false },
  { id: 's5', name: 'Combo Vệ Sinh Toàn Phần', desc: 'Rửa + Đánh bóng + Vệ sinh máy', price: 220000, time: 90, popular: false },
];

const TIERS = [
  { id: 'dong',     name: 'Đồng',      min: 0,     bonus: '1x',   className: 'aw-tier-dong',     color: 'var(--tier-dong)' },
  { id: 'bac',      name: 'Bạc',       min: 500,   bonus: '1.2x', className: 'aw-tier-bac',      color: 'var(--tier-bac)' },
  { id: 'vang',     name: 'Vàng',      min: 1500,  bonus: '1.5x', className: 'aw-tier-vang',     color: 'var(--tier-vang)' },
  { id: 'platinum', name: 'Bạch Kim',  min: 3500,  bonus: '2x',   className: 'aw-tier-platinum', color: 'var(--tier-platinum)' },
];

const BIKES = [
  { id: 'b1', plate: '59P1-234.56', model: 'Honda Vision 2022', color: 'Xanh đen' },
  { id: 'b2', plate: '51F-789.12',  model: 'Yamaha Exciter 150',color: 'Đỏ tem' },
];

// Vietnamese names
const VN_NAMES = [
  'Nguyễn Văn An',   'Trần Thị Bích',  'Lê Hoàng Phúc',  'Phạm Minh Tuấn',
  'Hoàng Thu Hà',    'Vũ Quốc Bảo',     'Đặng Mai Linh',  'Bùi Đức Thành',
  'Đỗ Thị Hằng',     'Ngô Văn Hùng',    'Lý Thanh Tùng',  'Phan Ngọc Yến',
];

// Helpers
const formatVND = (n) => n.toLocaleString('vi-VN') + '₫';
const formatVNDShort = (n) =>
  n >= 1000000 ? (n / 1000000).toFixed(1).replace('.0', '') + 'tr' :
  n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);

// Tier component
function TierBadge({ tier, size = 'md' }) {
  const t = TIERS.find(x => x.id === tier) || TIERS[0];
  const s = size === 'lg' ? { padding: '6px 12px 6px 10px', fontSize: 12 } :
            size === 'sm' ? { padding: '2px 8px 2px 6px', fontSize: 10 } : {};
  return (
    <span className={`aw-tier-badge ${t.className}`} style={s}>
      <svg width="10" height="10" viewBox="0 0 12 12">
        <path d="M6 0l1.5 3.5L11 4l-2.5 2.5L9 10 6 8.3 3 10l.5-3.5L1 4l3.5-.5z" fill={t.color}/>
      </svg>
      {t.name}
    </span>
  );
}

// Mock customer
const CURRENT_CUSTOMER = {
  name: 'Nguyễn Văn An',
  phone: '0901 234 567',
  email: 'an.nguyen@gmail.com',
  tier: 'vang',
  points: 1840,
  totalSpent: 2_350_000,
  bikes: BIKES,
  joined: '03/2024',
};

// Mock bookings
const TODAY_BOOKINGS = [
  { id: 'BK-1024', time: '09:00', name: 'Trần Thị Bích',   plate: '59P1-234.56', service: 'Rửa kỹ + Lau bóng', price: 50000, status: 'in-progress' },
  { id: 'BK-1025', time: '09:30', name: 'Nguyễn Văn An',   plate: '51F-789.12',  service: 'Combo Vệ Sinh Toàn Phần', price: 220000, status: 'queued' },
  { id: 'BK-1026', time: '10:00', name: 'Lê Hoàng Phúc',   plate: '59A-456.78',  service: 'Rửa cơ bản', price: 30000, status: 'queued' },
  { id: 'BK-1027', time: '10:30', name: 'Phạm Minh Tuấn',  plate: '59X1-901.23', service: 'Rửa máy chuyên sâu', price: 80000, status: 'queued' },
  { id: 'BK-1028', time: '11:00', name: 'Hoàng Thu Hà',    plate: '59P2-345.67', service: 'Rửa kỹ + Lau bóng', price: 50000, status: 'queued' },
  { id: 'BK-1029', time: '11:30', name: 'Đặng Mai Linh',   plate: '51H-678.90',  service: 'Đánh bóng nhựa', price: 150000, status: 'queued' },
];

const MY_BOOKINGS = [
  { id: 'BK-1025', date: '26/05/2026', time: '09:30', service: 'Combo Vệ Sinh Toàn Phần', price: 220000, bike: '51F-789.12 · Exciter', status: 'upcoming' },
  { id: 'BK-1022', date: '20/05/2026', time: '17:00', service: 'Rửa kỹ + Lau bóng',         price: 50000,  bike: '59P1-234.56 · Vision', status: 'completed' },
  { id: 'BK-1018', date: '12/05/2026', time: '08:30', service: 'Rửa cơ bản',                 price: 30000,  bike: '59P1-234.56 · Vision', status: 'completed' },
  { id: 'BK-1014', date: '02/05/2026', time: '16:30', service: 'Rửa máy chuyên sâu',         price: 80000,  bike: '51F-789.12 · Exciter', status: 'completed' },
];

const POINT_HISTORY = [
  { date: '20/05', desc: 'Rửa kỹ + Lau bóng',         amount: '+75' },
  { date: '12/05', desc: 'Rửa cơ bản',                  amount: '+45' },
  { date: '08/05', desc: 'Đổi voucher giảm 30K',        amount: '−300' },
  { date: '02/05', desc: 'Rửa máy chuyên sâu',          amount: '+120' },
  { date: '20/04', desc: 'Combo Vệ Sinh Toàn Phần',     amount: '+330' },
  { date: '15/04', desc: 'Thưởng sinh nhật',            amount: '+200' },
];

const PROMOTIONS = [
  { id: 'p1', code: 'CHAOMAY26',  title: 'Chào Hè 2026',           discount: '20%',   uses: 187, max: 500, status: 'active',   start: '01/05/26', end: '30/06/26' },
  { id: 'p2', code: 'SINHNHAT',   title: 'Sinh nhật khách',         discount: '−50K',  uses: 32,  max: 999, status: 'active',   start: 'Tự động',  end: '—' },
  { id: 'p3', code: 'COMBO150',   title: 'Combo 3 lần giặt',        discount: '−150K', uses: 78,  max: 200, status: 'active',   start: '15/04/26', end: '15/07/26' },
  { id: 'p4', code: 'KHAITRUONG', title: 'Khai trương chi nhánh 2', discount: '30%',   uses: 412, max: 500, status: 'expired',  start: '01/03/26', end: '30/04/26' },
];

const CUSTOMERS_LIST = [
  { name: 'Nguyễn Văn An',   phone: '0901 234 567', tier: 'vang',     points: 1840, visits: 24, spent: 2350000 },
  { name: 'Trần Thị Bích',   phone: '0908 765 432', tier: 'platinum', points: 4120, visits: 56, spent: 5_780_000 },
  { name: 'Lê Hoàng Phúc',   phone: '0912 345 678', tier: 'bac',      points: 720,  visits: 11, spent: 890_000 },
  { name: 'Phạm Minh Tuấn',  phone: '0987 654 321', tier: 'dong',     points: 180,  visits: 4,  spent: 240_000 },
  { name: 'Hoàng Thu Hà',    phone: '0933 222 111', tier: 'vang',     points: 2240, visits: 31, spent: 3_120_000 },
  { name: 'Vũ Quốc Bảo',     phone: '0944 555 666', tier: 'bac',      points: 940,  visits: 13, spent: 1_080_000 },
  { name: 'Đặng Mai Linh',   phone: '0966 777 888', tier: 'platinum', points: 3650, visits: 48, spent: 4_900_000 },
  { name: 'Bùi Đức Thành',   phone: '0977 999 000', tier: 'dong',     points: 320,  visits: 6,  spent: 380_000 },
];

// ─── Status pills ──────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    upcoming:    { label: 'Sắp tới',     bg: 'oklch(94% 0.03 210)', color: 'var(--primary-ink)' },
    completed:   { label: 'Hoàn tất',    bg: 'var(--green-soft)',   color: 'var(--green-ink)' },
    cancelled:   { label: 'Đã huỷ',      bg: 'var(--danger-soft)',  color: 'var(--danger)' },
    'in-progress':{ label: 'Đang rửa',   bg: 'oklch(94% 0.06 75)',  color: 'var(--gold-ink)' },
    queued:      { label: 'Đang chờ',    bg: 'var(--surface-2)',    color: 'var(--ink-700)' },
    active:      { label: 'Đang hoạt động', bg: 'var(--green-soft)', color: 'var(--green-ink)' },
    expired:     { label: 'Hết hạn',     bg: 'var(--surface-2)',    color: 'var(--ink-500)' },
  };
  const s = map[status] || map.queued;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {s.label}
    </span>
  );
}

Object.assign(window, {
  Icon, Icons, SERVICES, TIERS, BIKES, VN_NAMES, formatVND, formatVNDShort,
  TierBadge, CURRENT_CUSTOMER, TODAY_BOOKINGS, MY_BOOKINGS, POINT_HISTORY,
  PROMOTIONS, CUSTOMERS_LIST, StatusPill,
});
