import client from './client.js'

export async function getProfile() {
  const { data } = await client.get('/customers/me')
  return data
}

export async function updateProfile(payload) {
  const { data } = await client.put('/customers/me', payload)
  return data
}

export async function getLoyalty() {
  const { data } = await client.get('/customers/me/loyalty')
  return data
}

export async function getVehicles(params = {}) {
  const { data } = await client.get('/customers/me/vehicles', { params: { page: 1, pageSize: 50, ...params } })
  return data
}

export async function addVehicle(payload) {
  const { data } = await client.post('/customers/me/vehicles', payload)
  return data
}

export async function deleteVehicle(id) {
  await client.delete(`/customers/me/vehicles/${id}`)
}

export async function getNotifications(params = {}) {
  const { data } = await client.get('/customers/me/notifications', { params: { page: 1, pageSize: 20, ...params } })
  return data
}

export async function getMyBookings(params = {}) {
  const { data } = await client.get('/bookings/me', { params: { page: 1, pageSize: 20, ...params } })
  return data
}

export async function createBooking(payload) {
  const { data } = await client.post('/bookings', payload)
  return data
}

export async function cancelBooking(id) {
  await client.delete(`/bookings/${id}`)
}

export async function getAvailability(date, pricingId) {
  const { data } = await client.get('/bookings/availability', { params: { date, pricingId } })
  return data
}
