export const formatVND = (n = 0) => Number(n).toLocaleString('vi-VN') + '₫'

export const formatVNDShort = (n = 0) => {
  const value = Number(n)
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace('.0', '') + 'tr'
  if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K'
  return String(value)
}

export const toLocalDateTimeValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export const formatTime = (value) => {
  if (!value) return '--:--'
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
}

export const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
}
