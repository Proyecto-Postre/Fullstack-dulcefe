import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Admin Hardening & Stability Regression Guards (PR Fix / Master Plan)', () => {
  const rootAppDir = path.resolve(__dirname, '../../app')
  const rootServerDir = path.resolve(__dirname, '../../server')

  describe('1. Modal Portals Integrity', () => {
    it('app/layouts/admin.vue debe definir el portal contenedor #admin-modal-portal', () => {
      const layoutContent = fs.readFileSync(path.join(rootAppDir, 'layouts/admin.vue'), 'utf-8')
      expect(layoutContent).toContain('id="admin-modal-portal"')
    })

    it('app/app.vue debe tener el fallback del portal contenedor #admin-modal-portal', () => {
      const appContent = fs.readFileSync(path.join(rootAppDir, 'app.vue'), 'utf-8')
      expect(appContent).toContain('id="admin-modal-portal"')
    })

    it('Todos los modales de administración deben estar en ClientOnly y teleportarse a #admin-modal-portal', () => {
      const adminModals = [
        'components/admin/MaterialModal.vue',
        'components/admin/ProductModal.vue',
        'components/admin/NewOrderModal.vue',
        'components/admin/OrderDetailsModal.vue'
      ]

      for (const modalRelPath of adminModals) {
        const modalFile = path.join(rootAppDir, modalRelPath)
        expect(fs.existsSync(modalFile), `El modal ${modalRelPath} debe existir`).toBe(true)
        const content = fs.readFileSync(modalFile, 'utf-8')
        expect(
          content.includes('to="#admin-modal-portal"'),
          `El modal ${modalRelPath} debe usar <Teleport to="#admin-modal-portal">`
        ).toBe(true)
        expect(
          content.includes('<ClientOnly>'),
          `El modal ${modalRelPath} debe estar envuelto en <ClientOnly> para evitar Hydration Mismatches`
        ).toBe(true)
      }
    })

    it('public/placeholder-cake.png debe existir para prevenir errores 404 en vitrina y checkout', () => {
      const publicDir = path.resolve(__dirname, '../../public')
      const placeholderFile = path.join(publicDir, 'placeholder-cake.png')
      expect(fs.existsSync(placeholderFile), 'placeholder-cake.png debe existir en public/').toBe(true)
    })
  })

  describe('2. Server Guards & RLS Deadlock Prevention', () => {
    it('server/utils/require-user.ts debe normalizar id y sub desde JwtPayload', () => {
      const requireUserContent = fs.readFileSync(path.join(rootServerDir, 'utils/require-user.ts'), 'utf-8')
      expect(requireUserContent).toContain('sub')
      expect(requireUserContent).toContain('userId')
    })

    it('server/utils/require-admin.ts debe utilizar getAdminSupabaseClient y userId normalizado', () => {
      const requireAdminContent = fs.readFileSync(path.join(rootServerDir, 'utils/require-admin.ts'), 'utf-8')
      expect(requireAdminContent).toContain('getAdminSupabaseClient')
      expect(requireAdminContent).toContain('.from(\'profiles\')')
      expect(requireAdminContent).toContain('.select(\'*\')')
      expect(requireAdminContent).toContain('userId')
      expect(requireAdminContent).toContain('profile.is_admin')
    })

    it('server/utils/server-supabase.ts debe proveer getAdminSupabaseClient con fallback limpio ante ausencia de service key', () => {
      const serverSupabaseContent = fs.readFileSync(path.join(rootServerDir, 'utils/server-supabase.ts'), 'utf-8')
      expect(serverSupabaseContent).toContain('serverSupabaseServiceRole')
      expect(serverSupabaseContent).toContain('serverSupabaseClient')
      expect(serverSupabaseContent).toContain('getAdminSupabaseClient')
    })

    it('server/api/raw-materials/index.get.ts debe consultar insumos mediante getAdminSupabaseClient', () => {
      const rawMaterialsGet = fs.readFileSync(path.join(rootServerDir, 'api/raw-materials/index.get.ts'), 'utf-8')
      expect(rawMaterialsGet).toContain('getAdminSupabaseClient')
      expect(rawMaterialsGet).toContain('.from(\'raw_materials\')')
    })
  })

  describe('3. Sesiones Zombi & Sincronización Auth', () => {
    it('app/stores/auth.ts debe contar con método clearSession y sincronización de auth state', () => {
      const authStoreContent = fs.readFileSync(path.join(rootAppDir, 'stores/auth.ts'), 'utf-8')
      expect(authStoreContent).toContain('clearSession')
      expect(authStoreContent).toContain('onAuthStateChange')
      expect(authStoreContent).toContain('SIGNED_OUT')
    })

    it('app/middleware/admin-only.ts debe purgar store si useSupabaseUser() es nulo', () => {
      const middlewareContent = fs.readFileSync(path.join(rootAppDir, 'middleware/admin-only.ts'), 'utf-8')
      expect(middlewareContent).toContain('authStore.clearSession()')
      expect(middlewareContent).toContain('return navigateTo(\'/login\')')
    })
  })

  describe('4. KDS Resiliencia ante Errores 401/403', () => {
    it('app/pages/admin/kds.vue debe detectar statusCode 401/403, detener timer y permitir reautenticación', () => {
      const kdsContent = fs.readFileSync(path.join(rootAppDir, 'pages/admin/kds.vue'), 'utf-8')
      expect(kdsContent).toContain('isAuthError')
      expect(kdsContent).toContain('statusCode === 401 || statusCode === 403')
      expect(kdsContent).toContain('clearInterval(pollTimer)')
      expect(kdsContent).toContain('to="/login"')
    })
  })
})
