import { ref, computed, type Ref } from 'vue'
import type { RecipeItem, AdditionalCosts, NewRecipeItemInput, RecipeApiResponse } from '../../types/recipe'
import type { ProductRow } from '../../types/catalog'

export function calculateComputedTotalCost(materialCost: number, additional: AdditionalCosts): number {
  const packaging = Number(additional.packaging) || 0
  const utilities = Number(additional.utilities) || 0
  const labor = Number(additional.labor) || 0
  return Number((materialCost + packaging + utilities + labor).toFixed(2))
}

export function calculateProfitMargin(salePrice: number, totalCost: number): number {
  return Number((salePrice - totalCost).toFixed(2))
}

export function calculateProfitMarginPercent(salePrice: number, totalCost: number): number {
  if (salePrice <= 0) return 0
  const margin = salePrice - totalCost
  return Number(((margin / salePrice) * 100).toFixed(1))
}

export function calculateSuggestedPrice(totalCost: number, targetMarginPercent: number = 30): number {
  if (totalCost <= 0) return 0
  // Margen sobre precio de venta: Precio = Costo / (1 - Margen%)
  const marginDecimal = targetMarginPercent / 100
  if (marginDecimal >= 1) return totalCost * 2
  return Number((totalCost / (1 - marginDecimal)).toFixed(2))
}

export function useAdminRecipes(activeProduct: Ref<ProductRow | null | undefined>) {
  const recipeItems = ref<RecipeItem[]>([])
  const recipeTotalCost = ref<number>(0)
  const additionalCosts = ref<AdditionalCosts>({ packaging: 0, utilities: 0, labor: 0 })
  const newRecipeItem = ref<NewRecipeItemInput>({ raw_material_id: '', quantity_used: '' })
  
  const isSubmittingRecipe = ref<boolean>(false)
  const pendingRecipe = ref<boolean>(false)
  const recipeErrorMessage = ref<string>('')
  const isExporting = ref<boolean>(false)
  const isPublishing = ref<boolean>(false)
  const publishData = ref<{ price: number; stock: number }>({ price: 0, stock: 0 })

  const computedTotalCost = computed<number>(() => {
    return calculateComputedTotalCost(recipeTotalCost.value, additionalCosts.value)
  })

  const profitMargin = computed<number>(() => {
    const price = Number(activeProduct.value?.price || 0)
    return calculateProfitMargin(price, computedTotalCost.value)
  })

  const profitMarginPercent = computed<number>(() => {
    const price = Number(activeProduct.value?.price || 0)
    return calculateProfitMarginPercent(price, computedTotalCost.value)
  })

  const suggestedPrice = computed<number>(() => {
    return calculateSuggestedPrice(computedTotalCost.value, 30)
  })

  function resetRecipeState(): void {
    recipeItems.value = []
    recipeTotalCost.value = 0
    additionalCosts.value = { packaging: 0, utilities: 0, labor: 0 }
    publishData.value = { price: 0, stock: 0 }
    recipeErrorMessage.value = ''
  }

  async function fetchRecipe(): Promise<void> {
    if (!activeProduct.value?.id) {
      resetRecipeState()
      return
    }

    pendingRecipe.value = true
    recipeErrorMessage.value = ''
    additionalCosts.value = { packaging: 0, utilities: 0, labor: 0 }

    try {
      const res = await $fetch<RecipeApiResponse>(`/api/recipes/${activeProduct.value.id}`)
      if (res && res.success) {
        recipeItems.value = res.data || []
        recipeTotalCost.value = Number(res.totalCost ?? res.total_cost ?? 0)
      }
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
      recipeErrorMessage.value = fetchErr.data?.statusMessage || fetchErr.message || 'Error al cargar receta.'
    } finally {
      pendingRecipe.value = false
    }
  }

  async function addRecipeItem(): Promise<boolean> {
    if (!activeProduct.value?.id) return false
    if (!newRecipeItem.value.raw_material_id || !newRecipeItem.value.quantity_used) {
      recipeErrorMessage.value = 'Selecciona un insumo e ingresa la cantidad.'
      return false
    }

    isSubmittingRecipe.value = true
    recipeErrorMessage.value = ''

    try {
      await $fetch('/api/recipes', {
        method: 'POST',
        body: {
          product_id: activeProduct.value.id,
          raw_material_id: Number(newRecipeItem.value.raw_material_id),
          quantity_used: Number(newRecipeItem.value.quantity_used)
        }
      })
      newRecipeItem.value = { raw_material_id: '', quantity_used: '' }
      await fetchRecipe()
      return true
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
      const msg = fetchErr.data?.statusMessage || fetchErr.message || 'Error al agregar insumo.'
      recipeErrorMessage.value = msg
      return false
    } finally {
      isSubmittingRecipe.value = false
    }
  }

  async function deleteRecipeItem(id: number | string): Promise<boolean> {
    recipeErrorMessage.value = ''
    try {
      await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      await fetchRecipe()
      return true
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
      const msg = fetchErr.data?.statusMessage || fetchErr.message || 'Error al quitar insumo.'
      recipeErrorMessage.value = msg
      return false
    }
  }

  function exportToExcel(): void {
    if (!activeProduct.value?.id) return
    isExporting.value = true

    const params = new URLSearchParams({
      productId: String(activeProduct.value.id),
      packaging: String(additionalCosts.value.packaging || 0),
      utilities: String(additionalCosts.value.utilities || 0),
      labor: String(additionalCosts.value.labor || 0)
    })

    const url = `/api/recipes/export?${params.toString()}`
    if (typeof window !== 'undefined') {
      window.location.href = url
    }

    setTimeout(() => {
      isExporting.value = false
    }, 1000)
  }

  async function publishProduct(): Promise<boolean> {
    if (!activeProduct.value?.id) return false
    isPublishing.value = true

    try {
      const res = await $fetch<{ success: boolean }>(`/api/products/${activeProduct.value.id}`, {
        method: 'PUT',
        body: {
          name: activeProduct.value.name,
          price: Number(publishData.value.price),
          stock: Number(publishData.value.stock),
          image_url: activeProduct.value.image_url
        }
      })
      return !!res.success
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
      recipeErrorMessage.value = fetchErr.data?.statusMessage || fetchErr.message || 'Error al publicar producto.'
      return false
    } finally {
      isPublishing.value = false
    }
  }

  return {
    recipeItems,
    recipeTotalCost,
    additionalCosts,
    newRecipeItem,
    isSubmittingRecipe,
    pendingRecipe,
    recipeErrorMessage,
    isExporting,
    isPublishing,
    publishData,
    computedTotalCost,
    profitMargin,
    profitMarginPercent,
    suggestedPrice,
    fetchRecipe,
    addRecipeItem,
    deleteRecipeItem,
    exportToExcel,
    publishProduct,
    resetRecipeState
  }
}
