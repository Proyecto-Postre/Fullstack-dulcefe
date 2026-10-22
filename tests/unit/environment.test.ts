import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getAppEnvironment,
  isProduction,
  isNonProduction,
  getCanonicalSiteUrl,
  getEnvironmentSubjectPrefix,
  getEnvironmentAlertBannerText
} from '../../server/utils/environment'

describe('Environment Utility Suite — Dulce Fe', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getAppEnvironment & Flags', () => {
    it('detecta production cuando APP_ENV es production', () => {
      process.env.APP_ENV = 'production'
      expect(getAppEnvironment()).toBe('production')
      expect(isProduction()).toBe(true)
      expect(isNonProduction()).toBe(false)
      expect(getEnvironmentSubjectPrefix()).toBe('')
      expect(getEnvironmentAlertBannerText()).toBeNull()
    })

    it('detecta production cuando VERCEL_ENV es production', () => {
      delete process.env.APP_ENV
      process.env.VERCEL_ENV = 'production'
      expect(getAppEnvironment()).toBe('production')
      expect(isProduction()).toBe(true)
      expect(isNonProduction()).toBe(false)
      expect(getEnvironmentSubjectPrefix()).toBe('')
    })

    it('detecta preview cuando VERCEL_ENV es preview', () => {
      delete process.env.APP_ENV
      process.env.VERCEL_ENV = 'preview'
      expect(getAppEnvironment()).toBe('preview')
      expect(isProduction()).toBe(false)
      expect(isNonProduction()).toBe(true)
      expect(getEnvironmentSubjectPrefix()).toBe('[PREVIEW] ')
      expect(getEnvironmentAlertBannerText()).toContain('VERCEL PREVIEW')
    })

    it('detecta development cuando APP_ENV es development o dev', () => {
      process.env.APP_ENV = 'development'
      expect(getAppEnvironment()).toBe('development')
      expect(isProduction()).toBe(false)
      expect(isNonProduction()).toBe(true)
      expect(getEnvironmentSubjectPrefix()).toBe('[PRUEBA / DEV] ')
      expect(getEnvironmentAlertBannerText()).toContain('ENTORNO LOCAL / DEV')
    })

    it('detecta development si la URL configurada apunta a localhost', () => {
      delete process.env.APP_ENV
      delete process.env.VERCEL_ENV
      delete process.env.NODE_ENV
      process.env.NUXT_PUBLIC_SITE_URL = 'http://localhost:3000'
      expect(getAppEnvironment()).toBe('development')
      expect(isNonProduction()).toBe(true)
    })
  })

  describe('getCanonicalSiteUrl', () => {
    it('prioriza NUXT_PUBLIC_SITE_URL si está definido', () => {
      process.env.NUXT_PUBLIC_SITE_URL = 'https://dulcefe.pe/'
      expect(getCanonicalSiteUrl()).toBe('https://dulcefe.pe')
    })

    it('utiliza VERCEL_PROJECT_PRODUCTION_URL como fallback', () => {
      delete process.env.NUXT_PUBLIC_SITE_URL
      process.env.VERCEL_PROJECT_PRODUCTION_URL = 'dulcefe-fullstack.vercel.app/'
      expect(getCanonicalSiteUrl()).toBe('https://dulcefe-fullstack.vercel.app')
    })

    it('utiliza VERCEL_URL en entornos preview', () => {
      delete process.env.NUXT_PUBLIC_SITE_URL
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL
      process.env.VERCEL_URL = 'fullstack-dulcefe-git-feature-preview.vercel.app'
      expect(getCanonicalSiteUrl()).toBe('https://fullstack-dulcefe-git-feature-preview.vercel.app')
    })

    it('hace fallback a http://localhost:3000 en entorno de desarrollo por defecto', () => {
      delete process.env.NUXT_PUBLIC_SITE_URL
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL
      delete process.env.VERCEL_URL
      process.env.APP_ENV = 'development'
      expect(getCanonicalSiteUrl()).toBe('http://localhost:3000')
    })
  })
})
