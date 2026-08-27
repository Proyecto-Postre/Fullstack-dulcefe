import { describe, it, expect, vi } from 'vitest'
import { requireUser } from '../../server/utils/require-user'
import { requireAdmin } from '../../server/utils/require-admin'

// Mock para '#supabase/server'
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn(),
  serverSupabaseClient: vi.fn()
}))

import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'

describe('Auth Guards — requireUser & requireAdmin (PR-1b / PR-1d / §18)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requireUser debe lanzar 401 si no hay usuario en sesión', async () => {
    const mockEvent = { context: {} } as any
    vi.mocked(serverSupabaseUser).mockResolvedValueOnce(null as any)

    try {
      await requireUser(mockEvent)
      expect.fail('Debería haber lanzado un error 401')
    } catch (error: any) {
      expect(error.statusCode).toBe(401)
      expect(error.data?.error?.code).toBe('UNAUTHORIZED')
    }
  })

  it('requireUser debe reutilizar el usuario si ya está en event.context.user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' } as any
    const mockEvent = { context: { user: mockUser } } as any

    const result = await requireUser(mockEvent)
    expect(result).toEqual(mockUser)
    expect(serverSupabaseUser).not.toHaveBeenCalled()
  })

  it('requireAdmin debe lanzar 403 si profiles.is_admin no es true', async () => {
    const mockUser = { id: 'user-regular', email: 'cliente@test.com' } as any
    const mockEvent = { context: { user: mockUser } } as any

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-regular', is_admin: false, role: 'authenticated' },
              error: null
            })
          })
        })
      })
    }
    vi.mocked(serverSupabaseClient).mockResolvedValueOnce(mockSupabase as any)

    try {
      await requireAdmin(mockEvent)
      expect.fail('Debería haber lanzado un error 403')
    } catch (error: any) {
      expect(error.statusCode).toBe(403)
      expect(error.data?.error?.code).toBe('FORBIDDEN')
    }
  })

  it('requireAdmin debe permitir el acceso si profiles.is_admin es true', async () => {
    const mockAdminUser = { id: 'admin-user', email: 'admin@dulcefe.com' } as any
    const mockEvent = { context: { user: mockAdminUser } } as any

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'admin-user', is_admin: true, role: 'admin' },
              error: null
            })
          })
        })
      })
    }
    vi.mocked(serverSupabaseClient).mockResolvedValueOnce(mockSupabase as any)

    const authContext = await requireAdmin(mockEvent)
    expect(authContext.user.id).toBe('admin-user')
    expect(authContext.profile.is_admin).toBe(true)
    expect(mockEvent.context.profile).toBeDefined()
  })
})
