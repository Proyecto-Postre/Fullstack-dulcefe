import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Admin Batch Recipes API Contracts & Security Suite (Fase 2 / Subfase 7.2)', () => {
  const apiDir = path.resolve(process.cwd(), 'server/api/admin')

  const expectedEndpoints = [
    'batch-recipes/index.get.ts',
    'batch-recipes/index.post.ts',
    'batch-recipes/[id].get.ts',
    'batch-recipes/[id].put.ts',
    'batch-recipes/[id].delete.ts',
    'product-recipes/[productId]/composition.get.ts',
    'product-recipes/mapping.post.ts',
    'batch-recipes/quick-deduction.post.ts',
    'dashboard/at-risk-products.get.ts'
  ]

  it('1. Todos los 9 endpoints HTTP de Nitro para tandas y porciones existen en el servidor', () => {
    for (const ep of expectedEndpoints) {
      const fullPath = path.join(apiDir, ep)
      expect(fs.existsSync(fullPath), `Endpoint ${ep} debe existir`).toBe(true)
    }
  })

  it('2. Todos los endpoints invocan BatchRecipeService y manejan request_id trazable', () => {
    for (const ep of expectedEndpoints) {
      const fullPath = path.join(apiDir, ep)
      const content = fs.readFileSync(fullPath, 'utf-8')
      expect(content).toContain('getOrCreateRequestId(event)')
      expect(content).toContain('BatchRecipeService')
    }
  })

  it('3. Los endpoints de escritura validan cuerpos o parámetros requeridos', () => {
    const putContent = fs.readFileSync(path.join(apiDir, 'batch-recipes/[id].put.ts'), 'utf-8')
    expect(putContent).toContain('getRouterParam')
    expect(putContent).toContain('readBody')

    const deleteContent = fs.readFileSync(path.join(apiDir, 'batch-recipes/[id].delete.ts'), 'utf-8')
    expect(deleteContent).toContain('getRouterParam')
  })
})
