export const ROUTES = {
  home:    '/',
  pricing: '/pricing',
  about:   '/about',
  login:   '/login',
  app:     '/app',
} as const

export const PUBLIC_INDEXED = [ROUTES.home, ROUTES.pricing, ROUTES.about] as const
