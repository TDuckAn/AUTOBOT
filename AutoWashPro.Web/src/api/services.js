import client from './client'

export async function listServices(params = {}) {
  const { data } = await client.get('/services', { params: { page: 1, pageSize: 100, ...params } })
  return data
}

export async function listPricing(serviceId, params = {}) {
  const { data } = await client.get(`/services/${serviceId}/pricing`, { params: { page: 1, pageSize: 100, ...params } })
  return data
}

export async function createService(payload) {
  const { data } = await client.post('/admin/services', payload)
  return data
}

export async function updateService(id, payload) {
  const { data } = await client.put(`/admin/services/${id}`, payload)
  return data
}

export async function createPricing(serviceId, payload) {
  const { data } = await client.post(`/admin/services/${serviceId}/pricing`, payload)
  return data
}

export async function updatePricing(serviceId, pricingId, payload) {
  const { data } = await client.put(`/admin/services/${serviceId}/pricing/${pricingId}`, payload)
  return data
}
