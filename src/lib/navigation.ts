import type { AppRoute } from '../types/app'

export function normalizeRoute(pathname: string): AppRoute {
  if (pathname === '/auth/signup') {
    return '/auth/signup'
  }

  if (pathname === '/auth/login') {
    return '/auth/login'
  }

  if (pathname === '/profile') {
    return '/profile'
  }

  return '/'
}

export function navigateTo(path: AppRoute) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
