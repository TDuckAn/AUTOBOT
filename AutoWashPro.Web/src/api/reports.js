import client from './client'

export async function getSummary(params = {}) {
  const { data } = await client.get('/admin/reports/summary', { params })
  return data
}

export async function getTierReview() {
  const { data } = await client.get('/admin/reports/tier-review')
  return data
}
