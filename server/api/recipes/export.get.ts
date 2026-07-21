import { serverSupabaseClient } from '#supabase/server'
import ExcelJS from 'exceljs'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const productId = query.productId as string
  const packaging = Number(query.packaging || 0)
  const utilities = Number(query.utilities || 0)
  const labor = Number(query.labor || 0)

  if (!productId) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el ID del producto.' })
  }

  const supabase = await serverSupabaseClient<any>(event)

  // Fetch product info
  const { data: product } = await supabase
    .from('products')
    .select('name, price')
    .eq('id', productId)
    .single()

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Producto no encontrado.' })
  }

  // Fetch recipe items
  const { data: items } = await supabase
    .from('recipe_items')
    .select(`
      quantity_used,
      raw_materials (
        name,
        unit,
        purchase_price,
        purchase_quantity
      )
    `)
    .eq('product_id', productId)

  // Crear el libro de Excel
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Dulce Fe ERP'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Escandallo', {
    views: [{ showGridLines: false }] // Clean white background outside table
  })

  // Estilos base
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
  }

  // Configurar anchos de columna
  worksheet.columns = [
    { header: 'Insumo', key: 'name', width: 35 },
    { header: 'Cantidad Usada', key: 'qty', width: 18 },
    { header: 'Unidad', key: 'unit', width: 12 },
    { header: 'Costo Unitario', key: 'costUnit', width: 20 },
    { header: 'Costo Parcial', key: 'costTotal', width: 22 }
  ]

  // Estilo de encabezados Principales
  const headerRow = worksheet.getRow(1)
  headerRow.height = 25
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5D23' } } // Verde Dulce Fe
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder
  })

  // Variables para rastrear las filas
  let currentRow = 2
  const firstIngredientRow = currentRow

  // Llenar ingredientes
  if (items && items.length > 0) {
    items.forEach((item, index) => {
      const mat = item.raw_materials
      const costPerUnit = (mat && mat.purchase_quantity > 0) 
        ? Number(mat.purchase_price) / Number(mat.purchase_quantity) 
        : 0

      const row = worksheet.addRow({
        name: mat?.name || 'Insumo desconocido',
        qty: Number(item.quantity_used),
        unit: mat?.unit || '',
        costUnit: costPerUnit
      })
      
      // Aplicar fórmula al Costo Parcial (Cantidad * Costo Unitario)
      row.getCell('costTotal').value = { formula: `B${currentRow}*D${currentRow}`, result: Number(item.quantity_used) * costPerUnit }
      
      // Formato y estilos de celda
      row.eachCell((cell, colNumber) => {
        cell.border = thinBorder
        cell.alignment = { vertical: 'middle' }
        if (colNumber > 1) cell.alignment.horizontal = 'center'
        if (colNumber === 4 || colNumber === 5) cell.alignment.horizontal = 'right'
        
        // Cebra sutil
        if (index % 2 !== 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
        }
      })

      row.getCell('qty').numFmt = '#,##0.00'
      row.getCell('costUnit').numFmt = '"S/" #,##0.0000'
      row.getCell('costTotal').numFmt = '"S/" #,##0.00'
      
      currentRow++
    })
  } else {
    const row = worksheet.addRow({ name: 'Sin ingredientes', qty: 0, unit: '-', costUnit: 0 })
    worksheet.getCell(`E${currentRow}`).value = 0
    row.eachCell((cell) => { cell.border = thinBorder })
    currentRow++
  }
  
  const lastIngredientRow = currentRow - 1

  // Espacio en blanco
  currentRow++

  // --- COSTOS FIJOS ---
  // Título Sección
  const cifHeaderRow = worksheet.getRow(currentRow)
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  const cifCell = cifHeaderRow.getCell(1)
  cifCell.value = 'COSTOS INDIRECTOS (CIF)'
  cifCell.font = { bold: true, color: { argb: 'FF4A5D23' }, size: 10 }
  cifCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F1E1' } }
  cifCell.alignment = { vertical: 'middle', horizontal: 'center' }
  cifCell.border = thinBorder
  cifHeaderRow.height = 20
  currentRow++

  // Helper para filas de costos fijos
  const addFixedCostRow = (name: string, val: number) => {
    const row = worksheet.addRow({ name })
    row.getCell('costTotal').value = val
    row.getCell('costTotal').numFmt = '"S/" #,##0.00'
    
    // Merge de A hasta D
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
    
    row.getCell(1).alignment = { vertical: 'middle', indent: 1 }
    row.getCell('costTotal').alignment = { vertical: 'middle', horizontal: 'right' }
    row.getCell(1).border = thinBorder
    row.getCell('costTotal').border = thinBorder
    
    currentRow++
    return currentRow - 1
  }

  const rowPkgNum = addFixedCostRow('Empaques y Bases', packaging)
  const rowUtilNum = addFixedCostRow('Servicios (Luz, Agua, Gas)', utilities)
  const rowLaborNum = addFixedCostRow('Mano de Obra', labor)

  // Espacio en blanco
  currentRow++

  // --- RESUMEN FINANCIERO ---
  const finHeaderRow = worksheet.getRow(currentRow)
  worksheet.mergeCells(`A${currentRow}:E${currentRow}`)
  const finCell = finHeaderRow.getCell(1)
  finCell.value = 'RESUMEN FINANCIERO: ' + product.name.toUpperCase()
  finCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  finCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2A321B' } }
  finCell.alignment = { vertical: 'middle', horizontal: 'center' }
  finCell.border = thinBorder
  finHeaderRow.height = 25
  currentRow++

  // Helper para totales
  const addTotalRow = (name: string, formulaStr: string, colorHex: string, defaultResult: number) => {
    const row = worksheet.addRow({ name })
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
    
    row.getCell(1).font = { bold: true, size: 11 }
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
    row.getCell(1).border = thinBorder
    
    const costCell = row.getCell('costTotal')
    if (formulaStr.startsWith('=')) {
        costCell.value = { formula: formulaStr.substring(1), result: defaultResult }
    } else {
        costCell.value = defaultResult
    }
    
    costCell.numFmt = '"S/" #,##0.00'
    costCell.font = { bold: true, color: { argb: colorHex }, size: 12 }
    costCell.alignment = { vertical: 'middle', horizontal: 'right' }
    costCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
    costCell.border = thinBorder
    
    row.height = 22
    currentRow++
    return currentRow - 1
  }

  const totalRowIndex = addTotalRow('Costo Total de Producción', `=SUM(E${firstIngredientRow}:E${lastIngredientRow}) + E${rowPkgNum} + E${rowUtilNum} + E${rowLaborNum}`, 'FF991B1B', 0)
  const priceRowIndex = addTotalRow('Precio de Venta Sugerido', 'value', 'FF2A321B', Number(product.price))
  addTotalRow('Margen Bruto (Ganancia)', `=E${priceRowIndex} - E${totalRowIndex}`, 'FF4A5D23', 0)

  // Generar Buffer
  const buffer = await workbook.xlsx.writeBuffer()

  // Limpiar nombre para el archivo
  const safeName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  // Set Headers para descarga de Excel
  setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="escandallo_${safeName}.xlsx"`)

  return buffer
})
