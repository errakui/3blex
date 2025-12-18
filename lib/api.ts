/**
 * Helper per URL API
 * In produzione usa URL relativi, in sviluppo usa la variabile d'ambiente o localhost
 */

function getApiUrl(): string {
  // Se NEXT_PUBLIC_API_URL è configurato, usalo
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // In produzione, usa URL relativi
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    // Rileva ambienti di produzione
    const isProduction = 
      hostname.includes('koyeb.app') ||
      hostname.includes('fly.dev') ||
      hostname.includes('vercel.app') ||
      hostname.includes('netlify.app') ||
      (hostname !== 'localhost' && !hostname.includes('127.0.0.1'))
    
    if (isProduction) {
      return '' // URL relativo - stesso dominio
    }
  }
  
  // In sviluppo, usa localhost (stesso server custom)
  return ''
}

export function apiUrl(path: string): string {
  const base = getApiUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

/**
 * Helper per fetch autenticato
 */
export async function authFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  })
  
  // Se token scaduto o non valido, redirect a login
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Sessione scaduta')
  }
  
  return response
}

/**
 * GET autenticato
 */
export async function apiGet(path: string) {
  const response = await authFetch(path)
  return response.json()
}

/**
 * POST autenticato
 */
export async function apiPost(path: string, data: any) {
  const response = await authFetch(path, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * PUT autenticato
 */
export async function apiPut(path: string, data: any) {
  const response = await authFetch(path, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * DELETE autenticato
 */
export async function apiDelete(path: string) {
  const response = await authFetch(path, {
    method: 'DELETE',
  })
  return response.json()
}
