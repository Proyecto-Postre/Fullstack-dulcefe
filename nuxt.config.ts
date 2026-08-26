export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
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

  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_KEY || '',
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || '51998265700',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },
  
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