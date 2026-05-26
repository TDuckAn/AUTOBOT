import client from './client.js'

export async function listVehicleTypes() {
  const { data } = await client.get('/vehicle-types')
  return data
}

export async function createVehicleType(payload) {
  const { data } = await client.post('/vehicle-types', payload)
  return data
}

export async function deleteVehicleType(id) {
  await client.delete(`/vehicle-types/${id}`)
}
