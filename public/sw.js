const CACHE_NAME = 'undanganku-shell-v5'
const APP_SHELL = [
  new URL('./', self.registration.scope).toString(),
  new URL('./index.html', self.registration.scope).toString(),
  new URL('./manifest.webmanifest', self.registration.scope).toString(),
  new URL('./icon.svg', self.registration.scope).toString(),
  new URL('./icon-180.png', self.registration.scope).toString(),
  new URL('./icon-192.png', self.registration.scope).toString(),
  new URL('./icon-512.png', self.registration.scope).toString(),
  new URL('./hero-couple.jpeg', self.registration.scope).toString(),
  new URL('./heart-divider.png', self.registration.scope).toString(),
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const requestUrl = new URL(event.request.url)
  const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document'
  const isAppCode = requestUrl.pathname.endsWith('.js') || requestUrl.pathname.endsWith('.css') || requestUrl.pathname.endsWith('.html')
  const isImage = event.request.destination === 'image'
  const isAppShellAsset = requestUrl.origin === self.location.origin && /\.(?:svg|webmanifest)$/i.test(requestUrl.pathname)

  if (!isDocument && !isAppCode && !isImage && !isAppShellAsset) return

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request)
      if (response.ok && requestUrl.origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(event.request, response.clone())
      }
      return response
    } catch (error) {
      const cached = await caches.match(event.request)
      if (cached) return cached
      throw error
    }
  })())
})
