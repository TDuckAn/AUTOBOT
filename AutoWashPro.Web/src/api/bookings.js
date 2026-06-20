import client from './client'

export async function getQueue(params = {}) {
  const { data } = await client.get('/admin/bookings/queue', { params: { page: 1, pageSize: 100, ...params } })
  return data
}

export async function getBookings(params = {}) {
  const { data } = await client.get('/admin/bookings', { params })
  return data
}

export async function completeBooking(id, pointsToRedeem = 0) {
  const { data } = await client.post(`/admin/bookings/${id}/complete`, { pointsToRedeem })
  return data
}

export async function createWalkInBooking(payload) {
  const { data } = await client.post('/admin/bookings/walk-in', payload)
  return data
}
