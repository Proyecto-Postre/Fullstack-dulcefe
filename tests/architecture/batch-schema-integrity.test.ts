import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '../../app/types/database.types'
import type {
  BaseRecipeDetail,
  RecipeYieldDetail,
  QuickPieceDeductionInput,
  ProductBatchComposition
} from '../../app/types/batch-recipe'

describe('Batch Recipe & Yields Schema Integrity Suite (Fase 1 / SSOT)', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations')
  const migrationFileName = '20260922152500_create_batch_recipes_and_yields.sql'
  const migrationFilePath = path.join(migrationsDir, migrationFileName)

  it('1. El archivo de migración de tandas existe y cumple la convención cronológica YYYYMMDDHHMMSS', () => {
    expect(fs.existsSync(migrationFilePath), `Migración ${migrationFileName} debe existir`).toBe(true)
    const namePattern = /^\d{14}_[a-z0-9_]+\.sql$/
    expect(migrationFileName).toMatch(namePattern)
  })

  it('2. La migración define las 6 tablas del modelo de tandas y porciones con RLS activo', () => {
    const content = fs.readFileSync(migrationFilePath, 'utf-8')

    const expectedTables = [
      'public.base_recipes',
      'public.base_recipe_items',
      'public.recipe_yields',
      'public.product_recipe_mappings',
      'public.product_packaging_items',
      'public.piece_waste_logs'
    ]

    for (const table of expectedTables) {
      expect(content).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
      expect(content).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
    }
  })

  it('3. Las políticas RLS blindan la gestión exclusivamente para administradores autenticados', () => {
    const content = fs.readFileSync(migrationFilePath, 'utf-8')

    const expectedPolicies = [
      'CREATE POLICY "Admin manage base_recipes"',
      'CREATE POLICY "Admin manage base_recipe_items"',
      'CREATE POLICY "Admin manage recipe_yields"',
      'CREATE POLICY "Admin manage product_recipe_mappings"',
      'CREATE POLICY "Admin manage product_packaging_items"',
      'CREATE POLICY "Admin manage piece_waste_logs"'
    ]

    for (const policy of expectedPolicies) {
      expect(content).toContain(policy)
    }

    // Verificar que todas usan public.is_admin()
    const adminCheckMatches = content.match(/public\.is_admin\(\)/g)
    expect(adminCheckMatches && adminCheckMatches.length).toBeGreaterThanOrEqual(6)
  })

  it('4. database.types.ts contiene las 6 tablas con sus columnas y contratos canónicos', () => {
    type BaseRecipeRow = Database['public']['Tables']['base_recipes']['Row']
    type BaseRecipeItemRow = Database['public']['Tables']['base_recipe_items']['Row']
    type RecipeYieldRow = Database['public']['Tables']['recipe_yields']['Row']
    type ProductRecipeMappingRow = Database['public']['Tables']['product_recipe_mappings']['Row']
    type ProductPackagingItemRow = Database['public']['Tables']['product_packaging_items']['Row']
    type PieceWasteLogRow = Database['public']['Tables']['piece_waste_logs']['Row']

    // Validar compatibilidad de tipos en tiempo de compilación TypeScript
    const mockRecipe: BaseRecipeRow = {
      id: 1,
      name: 'Masa Roles Clásica',
      description: 'Tanda estándar',
      labor_cost: 5.0,
      utilities_cost: 3.5,
      created_at: '2026-09-22T00:00:00Z',
      updated_at: '2026-09-22T00:00:00Z'
    }
    expect(mockRecipe.name).toBe('Masa Roles Clásica')

    const mockItem: BaseRecipeItemRow = {
      id: 1,
      base_recipe_id: 1,
      raw_material_id: 10,
      quantity_used: 1000,
      created_at: '2026-09-22T00:00:00Z'
    }
    expect(mockItem.quantity_used).toBe(1000)

    const mockYield: RecipeYieldRow = {
      id: 1,
      base_recipe_id: 1,
      size_name: 'Mediano',
      yield_units: 18,
      created_at: '2026-09-22T00:00:00Z'
    }
    expect(mockYield.yield_units).toBe(18)

    const mockMapping: ProductRecipeMappingRow = {
      id: 1,
      product_id: 101,
      recipe_yield_id: 1,
      units_contained: 6,
      created_at: '2026-09-22T00:00:00Z'
    }
    expect(mockMapping.units_contained).toBe(6)

    const mockPackaging: ProductPackagingItemRow = {
      id: 1,
      product_id: 101,
      raw_material_id: 50,
      quantity_used: 1,
      created_at: '2026-09-22T00:00:00Z'
    }
    expect(mockPackaging.quantity_used).toBe(1)

    const mockWaste: PieceWasteLogRow = {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      recipe_yield_id: 1,
      pieces_count: 2,
      reason: 'personal_consumption',
      notes: 'Consumo propio',
      profile_id: null,
      created_at: '2026-09-22T00:00:00Z'
    }
    expect(mockWaste.pieces_count).toBe(2)
  })

  it('5. batch-recipe.ts exporta los contratos de dominio para cálculos y DTOs', () => {
    const mockDetail: BaseRecipeDetail = {
      id: 1,
      name: 'Masa Roles Clásica',
      description: null,
      labor_cost: 5,
      utilities_cost: 3,
      cif_total: 8,
      materials_total_cost: 28,
      total_batch_cost: 36,
      created_at: '2026-09-22T00:00:00Z',
      updated_at: '2026-09-22T00:00:00Z',
      items: [],
      yields: [
        {
          id: 1,
          size_name: 'Mediano',
          yield_units: 18,
          unit_cost: 2.0 // 36 / 18
        }
      ]
    }
    expect(mockDetail.yields[0].unit_cost).toBe(2.0)

    const deductionInput: QuickPieceDeductionInput = {
      recipe_yield_id: 1,
      pieces_count: 2,
      reason: 'personal_consumption'
    }
    expect(deductionInput.pieces_count).toBe(2)
  })
})
