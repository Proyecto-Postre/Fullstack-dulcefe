import type { H3Event } from 'h3'
import { createError } from 'h3'
import { requireAdmin } from '../utils/require-admin'
import { getAdminSupabaseClient } from '../utils/server-supabase'
import { solesToCents, centsToSoles } from '../utils/money'
import type {
  BaseRecipeInput,
  BaseRecipeDetail,
  BaseRecipeItemDetail,
  RecipeYieldDetail,
  ProductRecipeMappingInput,
  ProductPackagingItemInput,
  ProductBatchComposition,
  QuickPieceDeductionInput,
  QuickPieceDeductionResult
} from '../../app/types/batch-recipe'

interface BaseRecipeQueryRecord {
  id: number
  name: string
  description: string | null
  labor_cost: number | null
  utilities_cost: number | null
  created_at: string
  updated_at: string
  base_recipe_items?: Array<{
    id: number
    raw_material_id: number
    quantity_used: number | null
    raw_materials?: {
      id: number
      name: string | null
      unit: string | null
      purchase_price: number | null
      purchase_quantity: number | null
    } | null
  }> | null
  recipe_yields?: Array<{
    id: number
    size_name: string
    yield_units: number
  }> | null
}

export class BatchRecipeService {
  /**
   * Obtiene todas las tandas registradas con sus insumos, rendimientos y costos calculados en céntimos y soles.
   */
  static async getBatchRecipes(event: H3Event, requestId: string): Promise<BaseRecipeDetail[]> {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const { data: recipes, error: err } = await supabase
      .from('base_recipes')
      .select(`
        id,
        name,
        description,
        labor_cost,
        utilities_cost,
        created_at,
        updated_at,
        base_recipe_items (
          id,
          raw_material_id,
          quantity_used,
          raw_materials ( id, name, unit, purchase_price, purchase_quantity, stock )
        ),
        recipe_yields (
          id,
          size_name,
          yield_units
        )
      `)
      .order('id', { ascending: true })

    if (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: { error: { code: 'INTERNAL_ERROR', message: `Error al obtener tandas: ${err.message}`, request_id: requestId } }
      })
    }

    return (recipes || []).map((rec) => this.calculateBatchCostDetail(rec))
  }

  /**
   * Obtiene una tanda específica por su ID con todo el detalle de escandallo.
   */
  static async getBatchRecipeById(event: H3Event, id: number, requestId: string): Promise<BaseRecipeDetail> {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const { data: rec, error: err } = await supabase
      .from('base_recipes')
      .select(`
        id,
        name,
        description,
        labor_cost,
        utilities_cost,
        created_at,
        updated_at,
        base_recipe_items (
          id,
          raw_material_id,
          quantity_used,
          raw_materials ( id, name, unit, purchase_price, purchase_quantity, stock )
        ),
        recipe_yields (
          id,
          size_name,
          yield_units
        )
      `)
      .eq('id', id)
      .single()

    if (err || !rec) {
      throw createError({
        statusCode: 404,
        statusMessage: 'NOT_FOUND',
        data: { error: { code: 'NOT_FOUND', message: 'Tanda no encontrada.', request_id: requestId } }
      })
    }

    return this.calculateBatchCostDetail(rec)
  }

  /**
   * Crea una nueva tanda con sus ingredientes y variantes de rendimiento.
   */
  static async createBatchRecipe(event: H3Event, dto: BaseRecipeInput, requestId: string): Promise<BaseRecipeDetail> {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    if (!dto.name?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'El nombre de la tanda es obligatorio.' })
    }
    if (!dto.items || dto.items.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'La tanda debe tener al menos un ingrediente.' })
    }
    if (!dto.yields || dto.yields.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Debes definir al menos un rendimiento/tamaño para la tanda.' })
    }

    // 1. Insertar cabecera de tanda
    const { data: batch, error: batchErr } = await supabase
      .from('base_recipes')
      .insert({
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        labor_cost: Number(dto.labor_cost) || 0,
        utilities_cost: Number(dto.utilities_cost) || 0
      })
      .select()
      .single()

    if (batchErr || !batch) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: { error: { code: 'INTERNAL_ERROR', message: `Error al crear tanda: ${batchErr?.message}`, request_id: requestId } }
      })
    }

    // 2. Insertar ingredientes
    const itemsToInsert = dto.items.map((it) => ({
      base_recipe_id: batch.id,
      raw_material_id: Number(it.raw_material_id),
      quantity_used: Number(it.quantity_used)
    }))

    const { error: itemsErr } = await supabase.from('base_recipe_items').insert(itemsToInsert)
    if (itemsErr) {
      await supabase.from('base_recipes').delete().eq('id', batch.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: { error: { code: 'INTERNAL_ERROR', message: `Error al registrar ingredientes: ${itemsErr.message}`, request_id: requestId } }
      })
    }

    // 3. Insertar variantes de rendimiento
    const yieldsToInsert = dto.yields.map((y) => ({
      base_recipe_id: batch.id,
      size_name: y.size_name.trim(),
      yield_units: Math.max(1, Number(y.yield_units))
    }))

    const { error: yieldsErr } = await supabase.from('recipe_yields').insert(yieldsToInsert)
    if (yieldsErr) {
      await supabase.from('base_recipes').delete().eq('id', batch.id)
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: { error: { code: 'INTERNAL_ERROR', message: `Error al registrar rendimientos: ${yieldsErr.message}`, request_id: requestId } }
      })
    }

    return this.getBatchRecipeById(event, batch.id, requestId)
  }

  /**
   * Actualiza una tanda existente, sus ingredientes y sus rendimientos.
   */
  static async updateBatchRecipe(event: H3Event, id: number, dto: BaseRecipeInput, requestId: string): Promise<BaseRecipeDetail> {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    if (!dto.name?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'El nombre de la tanda es obligatorio.' })
    }

    // 1. Actualizar cabecera
    const { error: updateErr } = await supabase
      .from('base_recipes')
      .update({
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        labor_cost: Number(dto.labor_cost) || 0,
        utilities_cost: Number(dto.utilities_cost) || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateErr) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: { error: { code: 'INTERNAL_ERROR', message: `Error al actualizar tanda: ${updateErr.message}`, request_id: requestId } }
      })
    }

    // 2. Si vienen items nuevos, reemplazar
    if (dto.items && dto.items.length > 0) {
      await supabase.from('base_recipe_items').delete().eq('base_recipe_id', id)
      const itemsToInsert = dto.items.map((it) => ({
        base_recipe_id: id,
        raw_material_id: Number(it.raw_material_id),
        quantity_used: Number(it.quantity_used)
      }))
      await supabase.from('base_recipe_items').insert(itemsToInsert)
    }

    // 3. Si vienen rendimientos nuevos, reemplazar
    if (dto.yields && dto.yields.length > 0) {
      await supabase.from('recipe_yields').delete().eq('base_recipe_id', id)
      const yieldsToInsert = dto.yields.map((y) => ({
        base_recipe_id: id,
        size_name: y.size_name.trim(),
        yield_units: Math.max(1, Number(y.yield_units))
      }))
      await supabase.from('recipe_yields').insert(yieldsToInsert)
    }

    return this.getBatchRecipeById(event, id, requestId)
  }

  /**
   * Elimina una tanda. Principio SSOT: NUNCA toca ni elimina materias primas del almacén.
   */
  static async deleteBatchRecipe(event: H3Event, id: number, requestId: string): Promise<boolean> {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    // Validar si algún producto comercial depende de sus rendimientos
    const { data: yields } = await supabase.from('recipe_yields').select('id').eq('base_recipe_id', id)
    const yieldIds = (yields || []).map((y) => y.id)

    if (yieldIds.length > 0) {
      const { data: mappings } = await supabase
        .from('product_recipe_mappings')
        .select('id, product_id, products(name)')
        .in('recipe_yield_id', yieldIds)

      if (mappings && mappings.length > 0) {
        const productNames = mappings.map((m) => (m.products as { name?: string })?.name || `Producto #${m.product_id}`).join(', ')
        throw createError({
          statusCode: 409,
          statusMessage: 'CONFLICT',
          data: {
            error: {
              code: 'RECIPE_IN_USE',
              message: `No se puede eliminar esta tanda porque está asignada a los productos: ${productNames}. Quita la asignación primero.`,
              request_id: requestId
            }
          }
        })
      }
    }

    const { error: delErr } = await supabase.from('base_recipes').delete().eq('id', id)
    if (delErr) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: { error: { code: 'INTERNAL_ERROR', message: `Error al eliminar tanda: ${delErr.message}`, request_id: requestId } }
      })
    }

    return true
  }

  /**
   * Obtiene la composición completa de porciones y empaques de un producto comercial.
   */
  static async getProductBatchComposition(event: H3Event, productId: number, requestId: string): Promise<ProductBatchComposition> {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    // 1. Consultar mapeo de tanda
    const { data: mappingData } = await supabase
      .from('product_recipe_mappings')
      .select(`
        id,
        recipe_yield_id,
        units_contained,
        recipe_yields (
          id,
          size_name,
          yield_units,
          base_recipes ( id, name, labor_cost, utilities_cost )
        )
      `)
      .eq('product_id', productId)
      .maybeSingle()

    // 2. Consultar empaques directos
    const { data: packagingData } = await supabase
      .from('product_packaging_items')
      .select(`
        id,
        raw_material_id,
        quantity_used,
        raw_materials ( id, name, unit, purchase_price, purchase_quantity, stock )
      `)
      .eq('product_id', productId)

    let mappingResult: ProductBatchComposition['mapping'] = null
    let doughCost = 0

    if (mappingData && mappingData.recipe_yields) {
      const yld = mappingData.recipe_yields as {
        id: number
        size_name: string
        yield_units: number
        base_recipes: { id: number; name: string; labor_cost: number; utilities_cost: number } | null
      }
      const baseRec = yld.base_recipes

      if (baseRec?.id) {
        const fullBatch = await this.getBatchRecipeById(event, baseRec.id, requestId)
        const matchedYield = fullBatch.yields.find((y) => y.id === yld.id)
        const unitPieceCost = matchedYield ? matchedYield.unit_cost : 0
        const unitsContained = Number(mappingData.units_contained) || 1
        const portionFraction = matchedYield?.yield_units ? Number((unitsContained / matchedYield.yield_units).toFixed(4)) : 0
        doughCost = Number((unitsContained * unitPieceCost).toFixed(2))

        mappingResult = {
          id: mappingData.id,
          recipe_yield_id: mappingData.recipe_yield_id,
          size_name: yld.size_name,
          yield_units: yld.yield_units,
          units_contained: unitsContained,
          unit_piece_cost: unitPieceCost,
          base_recipe_id: baseRec.id,
          base_recipe_name: baseRec.name,
          portion_fraction: portionFraction,
          dough_cost: doughCost
        }
      }
    }

    let packagingTotalCost = 0
    const packagingItems = (packagingData || []).map((pkg) => {
      const mat = pkg.raw_materials as {
        id: number
        name: string | null
        unit: string | null
        purchase_price: number | null
        purchase_quantity: number | null
      } | null

      const priceCents = solesToCents(mat?.purchase_price ?? 0)
      const purchaseQty = Number(mat?.purchase_quantity ?? 1)
      const costPerUnitCents = purchaseQty > 0 ? priceCents / purchaseQty : 0
      const qtyUsed = Number(pkg.quantity_used ?? 0)
      const itemCostCents = Math.round(costPerUnitCents * qtyUsed)
      const itemTotalCost = Number(centsToSoles(itemCostCents))

      packagingTotalCost += itemTotalCost

      return {
        id: pkg.id,
        raw_material_id: pkg.raw_material_id,
        material_name: mat?.name ?? 'Empaque',
        unit: mat?.unit ?? 'und',
        quantity_used: qtyUsed,
        unit_cost: Number(centsToSoles(Math.round(costPerUnitCents))),
        total_cost: itemTotalCost
      }
    })

    const totalProductCost = Number((doughCost + packagingTotalCost).toFixed(2))

    return {
      product_id: productId,
      mapping: mappingResult,
      packaging_items: packagingItems,
      total_product_cost: totalProductCost
    }
  }

  /**
   * Asigna o actualiza la porción de tanda y los empaques directos a un producto comercial.
   */
  static async saveProductBatchMapping(
    event: H3Event,
    dto: {
      product_id: number
      mapping?: ProductRecipeMappingInput | null
      packaging_items?: ProductPackagingItemInput[]
    },
    requestId: string
  ): Promise<ProductBatchComposition> {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const productId = Number(dto.product_id)
    if (!productId) {
      throw createError({ statusCode: 400, statusMessage: 'El ID del producto es obligatorio.' })
    }

    // 1. Guardar o limpiar porción de tanda
    await supabase.from('product_recipe_mappings').delete().eq('product_id', productId)

    if (dto.mapping && dto.mapping.recipe_yield_id && dto.mapping.units_contained > 0) {
      const { error: mapErr } = await supabase.from('product_recipe_mappings').insert({
        product_id: productId,
        recipe_yield_id: Number(dto.mapping.recipe_yield_id),
        units_contained: Number(dto.mapping.units_contained)
      })

      if (mapErr) {
        throw createError({
          statusCode: 500,
          statusMessage: 'INTERNAL_ERROR',
          data: { error: { code: 'INTERNAL_ERROR', message: `Error al guardar porción: ${mapErr.message}`, request_id: requestId } }
        })
      }
    }

    // 2. Guardar empaques directos
    await supabase.from('product_packaging_items').delete().eq('product_id', productId)

    if (dto.packaging_items && dto.packaging_items.length > 0) {
      const pkgsToInsert = dto.packaging_items.map((pkg) => ({
        product_id: productId,
        raw_material_id: Number(pkg.raw_material_id),
        quantity_used: Number(pkg.quantity_used)
      }))

      const { error: pkgErr } = await supabase.from('product_packaging_items').insert(pkgsToInsert)
      if (pkgErr) {
        throw createError({
          statusCode: 500,
          statusMessage: 'INTERNAL_ERROR',
          data: { error: { code: 'INTERNAL_ERROR', message: `Error al guardar empaques: ${pkgErr.message}`, request_id: requestId } }
        })
      }
    }

    return this.getProductBatchComposition(event, productId, requestId)
  }

  /**
   * Ejecuta el descargo rápido de piezas sueltas (consumo personal, regalo, merma o venta externa).
   * Calcula automáticamente la fracción de tanda consumida (piezas / rendimiento) y descuenta
   * las materias primas del almacén físico sin que el usuario haga cálculos manuales.
   */
  static async quickDeductPieces(
    event: H3Event,
    dto: QuickPieceDeductionInput,
    requestId: string
  ): Promise<QuickPieceDeductionResult> {
    const adminUser = await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    const piecesCount = Number(dto.pieces_count)
    if (!dto.recipe_yield_id || piecesCount <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Debes seleccionar un tamaño y especificar al menos 1 pieza.' })
    }

    // 1. Consultar rendimiento y su tanda
    const { data: yld, error: yldErr } = await supabase
      .from('recipe_yields')
      .select(`
        id,
        size_name,
        yield_units,
        base_recipe_id,
        base_recipes ( id, name )
      `)
      .eq('id', dto.recipe_yield_id)
      .single()

    if (yldErr || !yld) {
      throw createError({ statusCode: 404, statusMessage: 'Variante de rendimiento no encontrada.' })
    }

    const baseRec = yld.base_recipes as { id: number; name: string } | null
    if (!baseRec) {
      throw createError({ statusCode: 404, statusMessage: 'Tanda base no encontrada.' })
    }

    // 2. Consultar insumos de la tanda
    const { data: batchItems, error: itemsErr } = await supabase
      .from('base_recipe_items')
      .select(`
        raw_material_id,
        quantity_used,
        raw_materials ( id, name, unit, stock )
      `)
      .eq('base_recipe_id', baseRec.id)

    if (itemsErr || !batchItems || batchItems.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'La tanda no tiene insumos configurados para descontar.' })
    }

    // 3. Fracción consumida de la tanda
    const portionFraction = piecesCount / Number(yld.yield_units)

    // 4. Registrar en piece_waste_logs
    const { data: logEntry, error: logErr } = await supabase
      .from('piece_waste_logs')
      .insert({
        recipe_yield_id: yld.id,
        pieces_count: piecesCount,
        reason: dto.reason,
        notes: dto.notes || `Descargo rápido de ${piecesCount} ${yld.size_name}`,
        profile_id: adminUser.user.id
      })
      .select('id')
      .single()

    if (logErr || !logEntry) {
      throw createError({
        statusCode: 500,
        statusMessage: 'INTERNAL_ERROR',
        data: { error: { code: 'INTERNAL_ERROR', message: `Error al registrar bitácora: ${logErr?.message}`, request_id: requestId } }
      })
    }

    // 5. Descontar cada insumo en almacén y registrar en inventory_movements
    const deductedMaterials: Array<{ material_id: number; material_name: string; unit: string; quantity_deducted: number }> = []

    for (const item of batchItems) {
      const mat = item.raw_materials as { id: number; name: string | null; unit: string | null; stock: number | null } | null
      if (!mat) continue

      const currentStock = Number(mat.stock ?? 0)
      const qtyToDeduct = Number((Number(item.quantity_used) * portionFraction).toFixed(4))
      const newStock = Math.max(0, Number((currentStock - qtyToDeduct).toFixed(4)))

      // Actualizar stock físico en raw_materials
      await supabase.from('raw_materials').update({ stock: newStock }).eq('id', mat.id)

      // Registrar movimiento inmutable en kardex
      await supabase.from('inventory_movements').insert({
        raw_material_id: mat.id,
        order_id: null,
        type: 'waste_declaration',
        quantity_delta: -qtyToDeduct,
        stock_before: currentStock,
        stock_after: newStock,
        reason: `Descargo rápido: ${piecesCount} piezas de ${baseRec.name} (${yld.size_name}) - Motivo: ${dto.reason}`
      })

      deductedMaterials.push({
        material_id: mat.id,
        material_name: mat.name || `Insumo #${mat.id}`,
        unit: mat.unit || 'g',
        quantity_deducted: qtyToDeduct
      })
    }

    return {
      success: true,
      log_id: logEntry.id,
      pieces_deducted: piecesCount,
      yield_name: yld.size_name,
      base_recipe_name: baseRec.name,
      deducted_materials: deductedMaterials
    }
  }

  /**
   * Evalúa qué productos comerciales están en riesgo por falta de insumos o empaques en almacén.
   * Sirve para el nuevo panel del Dashboard Administrativo.
   */
  static async getAtRiskProducts(event: H3Event, _requestId?: string) {
    await requireAdmin(event)
    const supabase = await getAdminSupabaseClient(event)

    // Consultar productos activos
    const { data: products } = await supabase.from('products').select('id, name, price, image_url')

    if (!products || products.length === 0) {
      return { success: true, data: [] }
    }

    const atRiskList: Array<{
      product_id: number
      product_name: string
      price: number
      image_url: string | null
      critical_materials: Array<{ material_name: string; unit: string; required: number; available: number }>
    }> = []

    for (const prod of products) {
      const critical: Array<{ material_name: string; unit: string; required: number; available: number }> = []

      // 1. Verificar si usa tanda porcionada
      const { data: mapping } = await supabase
        .from('product_recipe_mappings')
        .select(`
          units_contained,
          recipe_yields (
            yield_units,
            base_recipes (
              base_recipe_items (
                quantity_used,
                raw_materials ( id, name, unit, stock )
              )
            )
          )
        `)
        .eq('product_id', prod.id)
        .maybeSingle()

      if (mapping && mapping.recipe_yields) {
        const yld = mapping.recipe_yields as {
          yield_units: number
          base_recipes: {
            base_recipe_items: Array<{
              quantity_used: number
              raw_materials: { id: number; name: string | null; unit: string | null; stock: number | null } | null
            }>
          } | null
        }

        const fraction = Number(mapping.units_contained) / Number(yld.yield_units || 1)
        const batchItems = yld.base_recipes?.base_recipe_items || []

        for (const it of batchItems) {
          const mat = it.raw_materials
          if (!mat) continue
          const required = Number((Number(it.quantity_used) * fraction).toFixed(4))
          const available = Number(mat.stock ?? 0)
          if (available < required) {
            critical.push({
              material_name: mat.name || 'Insumo',
              unit: mat.unit || 'g',
              required,
              available
            })
          }
        }
      }

      // 2. Verificar empaques directos
      const { data: packagings } = await supabase
        .from('product_packaging_items')
        .select(`
          quantity_used,
          raw_materials ( id, name, unit, stock )
        `)
        .eq('product_id', prod.id)

      for (const pkg of packagings || []) {
        const mat = pkg.raw_materials as { id: number; name: string | null; unit: string | null; stock: number | null } | null
        if (!mat) continue
        const required = Number(pkg.quantity_used)
        const available = Number(mat.stock ?? 0)
        if (available < required) {
          critical.push({
            material_name: mat.name || 'Empaque',
            unit: mat.unit || 'und',
            required,
            available
          })
        }
      }

      // 3. Si no tiene tanda ni empaque, verificar si tiene receta directa tradicional
      if (!mapping && (!packagings || packagings.length === 0)) {
        const { data: directRecipes } = await supabase
          .from('recipe_items')
          .select('quantity_used, raw_materials(id, name, unit, stock)')
          .eq('product_id', prod.id)

        for (const dr of directRecipes || []) {
          const mat = dr.raw_materials as { id: number; name: string | null; unit: string | null; stock: number | null } | null
          if (!mat) continue
          const required = Number(dr.quantity_used ?? 0)
          const available = Number(mat.stock ?? 0)
          if (available < required) {
            critical.push({
              material_name: mat.name || 'Insumo directo',
              unit: mat.unit || 'g',
              required,
              available
            })
          }
        }
      }

      if (critical.length > 0) {
        atRiskList.push({
          product_id: prod.id,
          product_name: prod.name,
          price: Number(prod.price) || 0,
          image_url: prod.image_url,
          critical_materials: critical
        })
      }
    }

    return {
      success: true,
      data: atRiskList
    }
  }
  /**
   * Helper aritmético interno para calcular costos de tanda y rendimientos sin desbordamiento de punto flotante.
   */
  private static calculateBatchCostDetail(rec: BaseRecipeQueryRecord): BaseRecipeDetail {
    const laborCostCents = solesToCents(rec.labor_cost || 0)
    const utilitiesCostCents = solesToCents(rec.utilities_cost || 0)
    const cifCents = laborCostCents + utilitiesCostCents

    let materialsTotalCents = 0
    const calculatedItems: BaseRecipeItemDetail[] = (rec.base_recipe_items || []).map((it) => {
      const mat = it.raw_materials
      const purchasePriceCents = solesToCents(mat?.purchase_price ?? 0)
      const purchaseQty = Number(mat?.purchase_quantity ?? 1)
      const costPerUnitCents = purchaseQty > 0 ? purchasePriceCents / purchaseQty : 0
      const quantityUsed = Number(it.quantity_used ?? 0)
      const itemCostCents = Math.round(costPerUnitCents * quantityUsed)
      materialsTotalCents += itemCostCents

      return {
        id: it.id,
        base_recipe_id: rec.id,
        raw_material_id: it.raw_material_id,
        material_name: mat?.name ?? 'Desconocido',
        unit: mat?.unit ?? 'g',
        purchase_price: Number(mat?.purchase_price ?? 0),
        purchase_quantity: purchaseQty,
        quantity_used: quantityUsed,
        cost_per_unit: Number(centsToSoles(Math.round(costPerUnitCents))),
        item_total_cost: Number(centsToSoles(itemCostCents))
      }
    })

    const totalBatchCostCents = materialsTotalCents + cifCents

    const calculatedYields: RecipeYieldDetail[] = (rec.recipe_yields || []).map((y) => {
      const units = Math.max(1, Number(y.yield_units || 1))
      const unitCostCents = Math.round(totalBatchCostCents / units)
      return {
        id: y.id,
        base_recipe_id: rec.id,
        size_name: y.size_name,
        yield_units: units,
        unit_cost: Number(centsToSoles(unitCostCents))
      }
    })

    return {
      id: rec.id,
      name: rec.name,
      description: rec.description,
      labor_cost: Number(centsToSoles(laborCostCents)),
      utilities_cost: Number(centsToSoles(utilitiesCostCents)),
      cif_total: Number(centsToSoles(cifCents)),
      materials_total_cost: Number(centsToSoles(materialsTotalCents)),
      total_batch_cost: Number(centsToSoles(totalBatchCostCents)),
      created_at: rec.created_at,
      updated_at: rec.updated_at,
      items: calculatedItems,
      yields: calculatedYields
    }
  }
}
