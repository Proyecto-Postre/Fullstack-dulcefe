export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  
  // AGREGA '@nuxtjs/tailwindcss' EXACTAMENTE AQUÍ:
  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt'
  ],
  
  supabase: {
    redirect: false
  }
})