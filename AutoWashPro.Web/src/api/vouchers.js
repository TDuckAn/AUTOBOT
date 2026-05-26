import client from './client.js'

// Public / customer
export async function listVoucherRules() {
  const { data } = await client.get('/voucher-rules')
  return data
}

export async function redeemVoucher(voucherRuleId) {
  const { data } = await client.post('/customers/me/redeem', { voucherRuleId })
  return data
}

export async function listMyVouchers() {
  const { data } = await client.get('/customers/me/vouchers')
  return data
}

// Admin
export async function adminListVoucherRules() {
  const { data } = await client.get('/voucher-rules/all')
  return data
}

export async function adminCreateVoucherRule(payload) {
  const { data } = await client.post('/voucher-rules', payload)
  return data
}

export async function adminUpdateVoucherRule(id, payload) {
  const { data } = await client.put(`/voucher-rules/${id}`, payload)
  return data
}

export async function adminDeleteVoucherRule(id) {
  await client.delete(`/voucher-rules/${id}`)
}
