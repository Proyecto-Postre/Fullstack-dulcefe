export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'es'
      },
      title: 'Dulce Fe — Pastelería Fina Artesanal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Pastelería fina y artesanal con ingredientes de la más alta calidad.' },
        { name: 'google-site-verification', content: 'O_LM8qeYZ9eGWxGmjrbpLPcmn6t4g2QJ8zMJ_19YLMw' },
        { name: 'theme-color', content: '#4A5D23' },
        { property: 'og:site_name', content: 'Dulce Fe' },
        { property: 'og:title', content: 'Dulce Fe — Pastelería Fina Artesanal' },
        { property: 'og:description', content: 'Pastelería fina y artesanal con ingredientes de la más alta calidad.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://dulcefe.vercel.app' },
        { property: 'og:image', content: 'https://dulcefe.vercel.app/og-banner.jpg' },
        { property: 'og:image:secure_url', content: 'https://dulcefe.vercel.app/og-banner.jpg' },
        { property: 'og:image:type', content: 'image/jpeg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Dulce Fe — Pastelería Fina Artesanal' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Dulce Fe — Pastelería Fina Artesanal' },
        { name: 'twitter:description', content: 'Pastelería fina y artesanal con ingredientes de la más alta calidad.' },
        { name: 'twitter:image', content: 'https://dulcefe.vercel.app/og-banner.jpg' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon-48x48.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap' }
      ],
      script: [
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-LFB3SEY29X',
          async: true
        },
        {
          innerHTML: 'window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag("js", new Date());gtag("config", "G-LFB3SEY29X");'
        },
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Dulce Fe',
            alternateName: ['Dulce Fe Pastelería', 'DulceFe'],
            url: 'https://dulcefe.vercel.app/'
          })
        }
      ]
    }
  },
  
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
      supabaseUrl: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || '51998265700',
      googleAnalyticsId: process.env.NUXT_PUBLIC_GTAG_ID || 'G-LFB3SEY29X',
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        (process.env.NODE_ENV === 'production' ? 'https://dulcefe.vercel.app' : 'http://localhost:3000')
    }
  },
  
  piniaPersistedstate: {
    cookieOptions: {
      sameSite: 'lax',
    },
    storage: 'localStorage'
  },
  
  routeRules: {
    '/admin': { ssr: false },
    '/admin/pedidos': { redirect: '/admin?tab=pedidos' },
    '/admin/**': { ssr: false }
  },

  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  }
})