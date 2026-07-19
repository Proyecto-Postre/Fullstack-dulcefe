export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  // AGREGA '@nuxtjs/tailwindcss' EXACTAMENTE AQUÍ:
  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon'
  ],
  
  supabase: {
    redirect: false
  }
})