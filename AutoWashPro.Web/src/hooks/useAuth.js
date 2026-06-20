import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'aw_token'
const DISPLAY_KEY = 'aw_display'
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(jwt, displayName = '') {
  localStorage.setItem(TOKEN_KEY, jwt)
  if (displayName) localStorage.setItem(DISPLAY_KEY, displayName)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(DISPLAY_KEY)
}

export function getDisplayName() {
  return localStorage.getItem(DISPLAY_KEY) ?? ''
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
