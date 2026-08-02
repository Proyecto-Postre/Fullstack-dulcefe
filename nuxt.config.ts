export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: false,
  
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  
  // AGREGA '@nuxtjs/tailwindcss' EXACTAMENTE AQUÍ:
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon'
  ],
  
  piniaPluginPersistedstate: {
    cookieOptions: {
      sameSite: 'lax',
    },
    storage: 'cookies'
  },
  
  supabase: {
    redirect: false
  }
})