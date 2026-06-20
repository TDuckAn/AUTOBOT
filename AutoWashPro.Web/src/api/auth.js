import client from './client.js'

export async function loginSystem(email, password) {
  const { data } = await client.post('/auth/system/login', { email, password })
  return data
}

export async function loginCustomer(payload) {
  const { data } = await client.post('/auth/customer/login', payload)
  return data
}

export async function registerCustomer(payload) {
  const { data } = await client.post('/auth/customer/register', payload)
  return data
}
