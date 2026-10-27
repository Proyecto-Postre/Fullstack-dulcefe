declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export default defineNuxtPlugin(() => {
  const router = useRouter()
  router.afterEach((to) => {
    // Excluir registro de navegación en el panel administrativo
    if (to.path.startsWith('/admin')) {
      return
    }

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('config', 'G-LFB3SEY29X', {
        page_path: to.fullPath,
        page_title: document.title,
        page_location: window.location.href
      })
    }
  })
})
