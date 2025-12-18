/**
 * Helper per URL API
 * In produzione usa URL relativi, in sviluppo usa la variabile d'ambiente o localhost
 */

function getApiUrl(): string {
  // Se NEXT_PUBLIC_API_URL è configurato, usalo
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // In produzione (Fly.io o qualsiasi dominio in produzione), usa URL relativi
  if (typeof window !== 'undefined') {
    // Client-side: rileva se siamo in produzione
    const isProduction = window.location.hostname.includes('fly.dev') || 
                         window.location.hostname !== 'localhost' ||
                         process.env.NODE_ENV === 'production'
    
    if (isProduction) {
      return '' // URL relativo - stesso dominio
    }
  }
  
  // In sviluppo, usa localhost
  return 'http://localhost:3001'
}

export function apiUrl(path: string): string {
  const base = getApiUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${cleanPath}`
}

