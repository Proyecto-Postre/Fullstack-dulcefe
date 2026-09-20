/**
 * Módulo de aritmética monetaria exacta (Cero floats IEEE 754).
 * Todos los cálculos de precios, subtotales y totales se manejan como céntimos enteros.
 */

/**
 * Convierte un monto en Soles (string "42.50" o número) a céntimos enteros (4250).
 * Aplica redondeo half-up para garantizar consistencia aritmética.
 */
export function solesToCents(amount: string | number): number {
  const numericVal = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numericVal)) {
    throw new Error(`Monto inválido para conversión monetaria: ${amount}`)
  }
  return Math.round(numericVal * 100)
}

/**
 * Convierte céntimos enteros (4250) a representación oficial en Soles ("42.50").
 */
export function centsToSoles(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`Los céntimos deben ser un número entero: ${cents}`)
  }
  return (cents / 100).toFixed(2)
}

/**
 * Formatea un monto en céntimos a la moneda local peruana para interfaz de usuario.
 */
export function formatPEN(cents: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(cents / 100)
}

/**
 * Calcula los puntos de fidelidad otorgados: 1 punto por cada Sol entero completado.
 */
export function calculateLoyaltyPoints(totalCents: number): number {
  return Math.floor(totalCents / 100)
}
