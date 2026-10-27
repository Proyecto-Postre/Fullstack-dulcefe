declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gtagId = config.public.googleAnalyticsId as string | undefined

  if (!gtagId) return

  // Inyección asíncrona no bloqueante de Google Tag
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag = gtag

  gtag('js', new Date())
  gtag('config', gtagId, {
    send_page_view: false
  })

  // Registro reactivo de vistas de página en la SPA (excluye /admin)
  const router = useRouter()
  router.afterEach((to) => {
    if (to.path.startsWith('/admin')) {
      return
    }

    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: to.fullPath
    })
  })
})
