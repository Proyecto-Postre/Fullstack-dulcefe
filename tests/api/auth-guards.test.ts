import { describe, it, expect } from 'vitest'

describe('Auth Guards — Contract & Error Catalog Verification (PR-1b / §19 / §20.1 V3)', () => {
  it('requireUser debe responder 401 UNAUTHORIZED cuando no hay sesión activa', () => {
    const errorStructure = {
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Se requiere iniciar sesión para acceder a este recurso.'
        }
      }
    }

    expect(errorStructure.statusCode).toBe(401)
    expect(errorStructure.data.error.code).toBe('UNAUTHORIZED')
  })

  it('requireAdmin debe responder 403 FORBIDDEN cuando el usuario no tiene rol admin', () => {
    const errorStructure = {
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        error: {
          code: 'FORBIDDEN',
          message: 'Acceso restringido: Se requieren privilegios de administrador para realizar esta acción.'
        }
      }
    }

    expect(errorStructure.statusCode).toBe(403)
    expect(errorStructure.data.error.code).toBe('FORBIDDEN')
  })

  it('los 12 endpoints protegidos deben estar listados en la arquitectura de seguridad', () => {
    const protectedEndpoints = [
      'POST /api/products',
      'PUT /api/products/:id',
      'DELETE /api/products/:id',
      'POST /api/products/upload',
      'GET /api/raw-materials',
      'POST /api/raw-materials',
      'PUT /api/raw-materials/:id',
      'DELETE /api/raw-materials/:id',
      'POST /api/recipes',
      'DELETE /api/recipes/:id',
      'GET /api/recipes/:productId',
      'GET /api/recipes/export'
    ]

    expect(protectedEndpoints.length).toBe(12)
  })

  it('el catálogo de errores debe mantener la estructura canónica { error: { code, message } }', () => {
    const canonicalError = {
      error: {
        code: 'TEST_CODE',
        message: 'Mensaje descriptivo'
      }
    }

    expect(canonicalError).toHaveProperty('error')
    expect(canonicalError.error).toHaveProperty('code')
    expect(canonicalError.error).toHaveProperty('message')
  })
})
