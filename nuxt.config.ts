// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/scripts'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],
  ui: {
    colorMode: false
  },

  runtimeConfig: {
    adminEmail: process.env.NUXT_ADMIN_EMAIL || '',
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || '',
    dbFilePath: process.env.NUXT_DB_FILE_PATH || './data/app.db',
    photosDir: process.env.NUXT_PHOTOS_DIR || './public/session1',
    sessionMaxAgeSeconds: process.env.NUXT_SESSION_MAX_AGE_SECONDS || '604800',
    public: {
      appName: 'Школьный фотоальбом'
    }
  },
  vite: {
    optimizeDeps: {
      include: [
        '@fancyapps/ui/dist/fancybox/fancybox.js',
      ]
    }
  },
  routeRules: {
    '/': { prerender: true }
  },


  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
  compatibilityDate: '2025-03-19'
})
