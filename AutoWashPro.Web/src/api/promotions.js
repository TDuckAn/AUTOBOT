import client from './client'

export async function listPromotions(params = {}) {
  const { data } = await client.get('/admin/promotions', { params: { includeInactive: true, page: 1, pageSize: 20, ...params } })
  return data
}

export async function createPromotion(payload) {
  const { data } = await client.post('/admin/promotions', payload)
  return data
}

export async function updatePromotion(id, payload) {
  const { data } = await client.put(`/admin/promotions/${id}`, payload)
  return data
}

export async function deletePromotion(id) {
  await client.delete(`/admin/promotions/${id}`)
}
