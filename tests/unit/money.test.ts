import { describe, it, expect } from 'vitest'
import { solesToCents, centsToSoles, formatPEN, calculateLoyaltyPoints } from '../../server/utils/money'

describe('Aritmética Monetaria Exacta (server/utils/money.ts)', () => {
  it('convierte cadenas de Soles a céntimos enteros con precisión', () => {
    expect(solesToCents('42.50')).toBe(4250)
    expect(solesToCents('0.10')).toBe(10)
    expect(solesToCents('0.20')).toBe(20)
    expect(solesToCents(15.99)).toBe(1599)
  })

  it('evita la trampa de coma flotante IEEE 754 (0.10 + 0.20)', () => {
    const c1 = solesToCents('0.10')
    const c2 = solesToCents('0.20')
    const sumCents = c1 + c2
    expect(sumCents).toBe(30)
    expect(centsToSoles(sumCents)).toBe('0.30')
  })

  it('convierte céntimos enteros a cadenas oficiales con dos decimales', () => {
    expect(centsToSoles(4250)).toBe('42.50')
    expect(centsToSoles(100)).toBe('1.00')
    expect(centsToSoles(5)).toBe('0.05')
    expect(centsToSoles(0)).toBe('0.00')
  })

  it('lanza error si se intenta convertir céntimos no enteros', () => {
    expect(() => centsToSoles(42.5)).toThrow()
  })

  it('calcula puntos de fidelidad descartando decimales (1 punto por Sol entero)', () => {
    expect(calculateLoyaltyPoints(4250)).toBe(42)
    expect(calculateLoyaltyPoints(99)).toBe(0)
    expect(calculateLoyaltyPoints(100)).toBe(1)
    expect(calculateLoyaltyPoints(15000)).toBe(150)
  })

  it('formatea montos en PEN adecuadamente', () => {
    const formatted = formatPEN(4250)
    expect(formatted).toContain('42.50')
  })

  it('lanza error con valores monetarios no numéricos o vacíos', () => {
    expect(() => solesToCents('no-un-numero')).toThrow(/Monto inválido/)
    expect(() => solesToCents(NaN)).toThrow(/Monto inválido/)
  })

  it('aplica redondeo half-up correctamente en montos con 3 decimales', () => {
    expect(solesToCents('42.505')).toBe(4251)
    expect(solesToCents('42.504')).toBe(4250)
    expect(solesToCents('0.005')).toBe(1)
    expect(solesToCents('0.004')).toBe(0)
  })

  it('maneja valores en cero y números grandes sin desbordamiento ni pérdida', () => {
    expect(solesToCents('0.00')).toBe(0)
    expect(centsToSoles(0)).toBe('0.00')
    expect(calculateLoyaltyPoints(0)).toBe(0)

    // Montos grandes (1 millón de soles = 100,000,000 céntimos)
    const granMonto = '1000000.00'
    const granCentimos = solesToCents(granMonto)
    expect(granCentimos).toBe(100_000_000)
    expect(centsToSoles(granCentimos)).toBe('1000000.00')
    expect(calculateLoyaltyPoints(granCentimos)).toBe(1_000_000)
  })
})
