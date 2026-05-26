import client from './client'

export async function listCustomers(params = {}) {
  const { data } = await client.get('/admin/customers', { params: { page: 1, pageSize: 20, ...params } })
  return data
}

export async function updateCustomerTier(id, tierId) {
  const { data } = await client.put(`/admin/customers/${id}/tier`, { tierId })
  return data
}
