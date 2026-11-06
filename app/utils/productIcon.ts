/**
 * Devuelve el identificador de icono Lucide referente para un producto
 * en función de su nombre o categoría cuando no cuenta con fotografía propia.
 */
export function getProductIcon(name?: string | null, categoryId?: string | null): string {
  const n = (name || '').toLowerCase()
  const c = (categoryId || '').toLowerCase()

  // 1. Dulces y repostería específica (Prioridad absoluta para evitar falsos positivos como alfajo-RES con carne)
  if (n.includes('alfajor')) return 'lucide:cookie'
  if (n.includes('galleta') || n.includes('cookie') || n.includes('pastiseta')) return 'lucide:cookie'
  if (n.includes('brownie')) return 'lucide:cookie'
  if (n.includes('trufa') || n.includes('chocoteja') || n.includes('bombón') || n.includes('bombon')) return 'lucide:cookie'
  if (n.includes('rol') || n.includes('roles')) return 'lucide:croissant'
  if (n.includes('orejita') || n.includes('milhoja') || n.includes('mil hojas')) return 'lucide:croissant'
  if (n.includes('tartaleta') || n.includes('tarta') || n.includes('pie') || n.includes('pai')) return 'lucide:pie-chart'
  if (n.includes('vaso') || n.includes('tres leches') || n.includes('cuchareable') || n.includes('mokka') || n.includes('selva negra') || n.includes('red velvet')) return 'lucide:cup-soda'
  if (n.includes('torta') || n.includes('pastel') || n.includes('cake') || n.includes('keke') || n.includes('queque') || n.includes('bizcochuelo')) return 'lucide:cake'
  if (n.includes('cupcake') || n.includes('muffin')) return 'lucide:cake-slice'

  // 2. Bocaditos y salados específicos (usando límites de palabra para evitar subcadenas no deseadas)
  if (n.includes('triple') || n.includes('sandwich') || n.includes('sándwich') || n.includes('pan')) return 'lucide:sandwich'
  if (n.includes('empanada') || n.includes('empanadita') || n.includes('hojaldre') || n.includes('croissant')) return 'lucide:croissant'
  if (n.includes('pollo') || n.includes('pechuga')) return 'lucide:drumstick'
  if (n.includes('carne') || /\b(res|lomo|asado|jamon|jamón|tocino|hot dog|salchicha)\b/i.test(n)) return 'lucide:beef'

  // 3. Fallback inteligente por Categoría
  if (c === 'bocaditos-eventos' || c === 'bocaditos') return 'lucide:party-popper'
  if (c === 'postres-individuales') return 'lucide:cake-slice'
  if (c === 'cuchareables') return 'lucide:cup-soda'
  if (c === 'cajas-degustacion' || c === 'boxes') return 'lucide:gift'
  if (c === 'tortas-y-pies' || c === 'tortas') return 'lucide:cake'

  return 'lucide:cake-slice'
}
