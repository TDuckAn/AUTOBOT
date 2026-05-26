import client from './client'

export async function loginSystem(email, password) {
  const { data } = await client.post('/auth/system/login', { email, password })
  return data
}
