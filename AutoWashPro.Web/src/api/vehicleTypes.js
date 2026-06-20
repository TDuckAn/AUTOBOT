import client from './client.js'

// Vehicle types change rarely but are needed on several pages. Cache the in-flight
// promise for the session so navigating between pages doesn't refetch; any mutation
// clears it so the next read is fresh.
let cache = null

export async function listVehicleTypes() {
  if (cache) return cache
  cache = client
    .get('/vehicle-types')
    .then((r) => r.data)
    .catch((err) => {
      cache = null
      throw err
    })
  return cache
}

export async function createVehicleType(payload) {
  const { data } = await client.post('/vehicle-types', payload)
  cache = null
  return data
}

export async function deleteVehicleType(id) {
  await client.delete(`/vehicle-types/${id}`)
  cache = null
}
