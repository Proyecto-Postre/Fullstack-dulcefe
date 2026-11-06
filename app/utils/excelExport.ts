import ExcelJS from 'exceljs'

export interface ExcelColumnDef {
  header: string
  key: string
  width?: number
  numFmt?: string
  alignment?: Partial<ExcelJS.Alignment>
}

export interface ExportToExcelOptions {
  filename: string
  sheetName: string
  columns: ExcelColumnDef[]
  rows: Record<string, unknown>[]
  title?: string
}

export async function exportToExcel({
  filename,
  sheetName,
  columns,
  rows,
  title
}: ExportToExcelOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Dulce Fe ERP'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }]
  })

  // Borde estándar sutil
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
  }

  let startRow = 1

  // Título superior opcional
  if (title) {
    const titleRow = worksheet.getRow(1)
    titleRow.values = [title]
    titleRow.height = 30
    titleRow.font = { name: 'Inter', size: 14, bold: true, color: { argb: 'FF2A321B' } }
    worksheet.mergeCells(1, 1, 1, columns.length)
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }
    startRow = 3
  }

  // Columnas
  worksheet.columns = columns.map(c => ({
    header: c.header,
    key: c.key,
    width: c.width || Math.max(c.header.length + 5, 12)
  }))

  // Re-posicionar encabezados si hay título
  if (startRow > 1) {
    worksheet.spliceRows(1, 0, [])
  }

  const headerRow = worksheet.getRow(startRow)
  headerRow.height = 26
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Inter', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A5D23' } // Verde Oliva Oficial Dulce Fe
    }
    cell.alignment = { vertical: 'middle', horizontal: columns[colNumber - 1]?.alignment?.horizontal || 'left' }
    cell.border = thinBorder
  })

  // Añadir filas de datos
  rows.forEach((rowData, index) => {
    const row = worksheet.addRow(rowData)
    row.height = 20
    const isEven = index % 2 === 0
    row.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1]
      cell.font = { name: 'Inter', size: 9, color: { argb: 'FF2A321B' } }
      cell.border = thinBorder
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9F8F3' } // Fondo suave tipo crema alternado
      }
      if (colDef?.alignment) {
        cell.alignment = { vertical: 'middle', ...colDef.alignment }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      }
      if (colDef?.numFmt) {
        cell.numFmt = colDef.numFmt
      }
    })
  })

  // Generar buffer y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
