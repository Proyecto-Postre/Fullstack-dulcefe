import { ref, computed } from 'vue'
import type {
  BaseRecipeDetail,
  BaseRecipeInput,
  ProductBatchComposition,
  QuickPieceDeductionInput,
  QuickPieceDeductionResult
} from '~/types/batch-recipe'
import type { RawMaterialRow } from '~/types/inventory'

export interface LiveYieldCost {
  size_name: string
  yield_units: number
  unit_cost: number
}

export interface LiveBatchCostSummary {
  materialsCost: number
  cifCost: number
  totalCost: number
  yieldCosts: LiveYieldCost[]
}

export interface ProportionalMaterialPreview {
  raw_material_id: number
  material_name: string
  unit: string
  quantity_to_deduct: number
  current_stock: number
}

/**
 * Calcula en tiempo real el costo de una tanda a partir de sus insumos y costos indirectos (CIF).
 */
export function calculateLiveBatchCost(
  items: Array<{ raw_material_id: number | string; quantity_used: number | string }>,
  materials: RawMaterialRow[] = [],
  laborCost: number | string = 0,
  utilitiesCost: number | string = 0,
  yields: Array<{ size_name: string; yield_units: number | string }> = []
): LiveBatchCostSummary {
  let materialsCost = 0

  for (const item of items) {
    const matId = Number(item.raw_material_id)
    const qty = Number(item.quantity_used) || 0
    if (!matId || qty <= 0) continue

    const mat = materials.find((m) => m.id === matId)
    if (mat) {
      const price = Number(mat.purchase_price) || 0
      const purchaseQty = Number(mat.purchase_quantity) || 1
      const costPerUnit = purchaseQty > 0 ? price / purchaseQty : 0
      materialsCost += costPerUnit * qty
    }
  }

  materialsCost = Number(materialsCost.toFixed(2))
  const cifCost = Number(((Number(laborCost) || 0) + (Number(utilitiesCost) || 0)).toFixed(2))
  const totalCost = Number((materialsCost + cifCost).toFixed(2))

  const yieldCosts: LiveYieldCost[] = yields.map((y) => {
    const units = Math.max(1, Number(y.yield_units) || 1)
    const unitCost = Number((totalCost / units).toFixed(2))
    return {
      size_name: y.size_name || 'Estándar',
      yield_units: units,
      unit_cost: unitCost
    }
  })

  return {
    materialsCost,
    cifCost,
    totalCost,
    yieldCosts
  }
}

/**
 * Calcula la previsualización de insumos a descontar proporcionalmente en un descargo de piezas.
 */
export function calculateProportionalPreview(
  batch: BaseRecipeDetail | null | undefined,
  yieldId: number,
  piecesCount: number
): ProportionalMaterialPreview[] {
  if (!batch || !batch.items || piecesCount <= 0) return []

  const matchedYield = batch.yields.find((y) => y.id === yieldId)
  if (!matchedYield || matchedYield.yield_units <= 0) return []

  const fraction = piecesCount / matchedYield.yield_units

  return batch.items.map((it) => {
    const qtyToDeduct = Number((it.quantity_used * fraction).toFixed(2))
    return {
      raw_material_id: it.raw_material_id,
      material_name: it.material_name,
      unit: it.unit,
      quantity_to_deduct: qtyToDeduct,
      current_stock: 0
    }
  })
}

/**
 * Calcula márgenes comerciales para un producto basado en costo total y precio de venta.
 */
export function calculateProductMargins(salePrice: number, totalCost: number) {
  const marginSoles = Number((salePrice - totalCost).toFixed(2))
  const marginPercent = salePrice > 0 ? Number(((marginSoles / salePrice) * 100).toFixed(1)) : 0
  return {
    marginSoles,
    marginPercent
  }
}

export function useAdminBatchRecipes() {
  const batchRecipes = ref<BaseRecipeDetail[]>([])
  const isLoading = ref<boolean>(false)
  const errorMessage = ref<string>('')

  /**
   * Carga todas las tandas registradas con sus insumos y rendimientos calculados.
   */
  async function fetchBatchRecipes(): Promise<BaseRecipeDetail[]> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const res = await $fetch<{ success: boolean; data: BaseRecipeDetail[] }>('/api/admin/batch-recipes')
      if (res && res.success) {
        batchRecipes.value = res.data || []
        return batchRecipes.value
      }
      return []
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string; error?: { message?: string } }; message?: string }
      errorMessage.value =
        fetchErr.data?.error?.message || fetchErr.data?.statusMessage || fetchErr.message || 'Error al cargar tandas.'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Guarda o actualiza una tanda base.
   */
  async function saveBatchRecipe(dto: BaseRecipeInput, id?: number): Promise<BaseRecipeDetail | null> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const endpoint = id ? `/api/admin/batch-recipes/${id}` : '/api/admin/batch-recipes'
      const method = id ? 'PUT' : 'POST'

      const res = await $fetch<{ success: boolean; data: BaseRecipeDetail }>(endpoint, {
        method,
        body: dto
      })

      if (res && res.success) {
        await fetchBatchRecipes()
        return res.data
      }
      return null
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string; error?: { message?: string } }; message?: string }
      errorMessage.value =
        fetchErr.data?.error?.message || fetchErr.data?.statusMessage || fetchErr.message || 'Error al guardar tanda.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Elimina una tanda base. Garantía SSOT: Las materias primas del almacén no se tocan.
   */
  async function deleteBatchRecipe(id: number): Promise<boolean> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const res = await $fetch<{ success: boolean }>(`/api/admin/batch-recipes/${id}`, {
        method: 'DELETE'
      })
      if (res && res.success) {
        batchRecipes.value = batchRecipes.value.filter((b) => b.id !== id)
        return true
      }
      return false
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string; error?: { message?: string } }; message?: string }
      errorMessage.value =
        fetchErr.data?.error?.message || fetchErr.data?.statusMessage || fetchErr.message || 'Error al eliminar tanda.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Obtiene la composición completa de porciones y empaques de un producto comercial.
   */
  async function fetchProductComposition(productId: number): Promise<ProductBatchComposition | null> {
    try {
      const res = await $fetch<{ success: boolean; data: ProductBatchComposition }>(
        `/api/admin/product-recipes/${productId}/composition`
      )
      return res?.success ? res.data : null
    } catch (err: unknown) {
      console.error('Error al obtener composición de producto:', err)
      return null
    }
  }

  /**
   * Asigna la porción de tanda y los empaques directos a un producto comercial.
   */
  async function saveProductComposition(dto: {
    product_id: number
    mapping?: { recipe_yield_id: number; units_contained: number } | null
    packaging_items?: Array<{ raw_material_id: number; quantity_used: number }>
  }): Promise<ProductBatchComposition | null> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const res = await $fetch<{ success: boolean; data: ProductBatchComposition }>('/api/admin/product-recipes/mapping', {
        method: 'POST',
        body: dto
      })
      return res?.success ? res.data : null
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string; error?: { message?: string } }; message?: string }
      errorMessage.value =
        fetchErr.data?.error?.message || fetchErr.data?.statusMessage || fetchErr.message || 'Error al guardar composición.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Descargo rápido de piezas sueltas (1 clic) deduciendo insumos proporcionalmente.
   */
  async function executeQuickDeduction(dto: QuickPieceDeductionInput): Promise<QuickPieceDeductionResult | null> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const res = await $fetch<{ success: boolean; data: QuickPieceDeductionResult }>(
        '/api/admin/batch-recipes/quick-deduction',
        {
          method: 'POST',
          body: dto
        }
      )
      return res?.success ? res.data : null
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string; error?: { message?: string } }; message?: string }
      errorMessage.value =
        fetchErr.data?.error?.message || fetchErr.data?.statusMessage || fetchErr.message || 'Error al descargar piezas.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    batchRecipes,
    isLoading,
    errorMessage,
    fetchBatchRecipes,
    saveBatchRecipe,
    deleteBatchRecipe,
    fetchProductComposition,
    saveProductComposition,
    executeQuickDeduction
  }
}
