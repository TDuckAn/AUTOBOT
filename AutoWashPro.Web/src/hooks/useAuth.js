import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'aw_token'
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(jwt) {
  localStorage.setItem(TOKEN_KEY, jwt)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getRole() {
  const token = getToken()
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    return decoded[ROLE_CLAIM] ?? decoded.role ?? null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  const token = getToken()
  if (!token) return false
  try {
    const { exp } = jwtDecode(token)
    return !exp || Date.now() < exp * 1000
  } catch {
    return false
  }
}
