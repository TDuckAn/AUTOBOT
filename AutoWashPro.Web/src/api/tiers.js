import client from './client'

export async function listTiers(params = {}) {
  const { data } = await client.get('/admin/tiers', { params: { page: 1, pageSize: 20, ...params } })
  return data
}

export async function updateTier(id, payload) {
  const { data } = await client.put(`/admin/tiers/${id}`, payload)
  return data
}
