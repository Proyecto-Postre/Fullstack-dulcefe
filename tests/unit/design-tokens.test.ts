import { describe, it, expect } from 'vitest'
import tailwindConfig from '../../tailwind.config'

describe('Design System — Semantic Tokens Verification (PR-2 / §9.1 / §20.2 V15)', () => {
  const colors = tailwindConfig.theme?.extend?.colors as any
  const fontFamily = tailwindConfig.theme?.extend?.fontFamily as any

  it('debe tener definido el color Brand Primary como #4A5D23', () => {
    expect(colors?.brand?.primary).toBe('#4A5D23')
  })

  it('debe tener definido el color Brand Secondary como #2A321B', () => {
    expect(colors?.brand?.secondary).toBe('#2A321B')
  })

  it('debe tener definido el color Brand Cream como #F4F1E1', () => {
    expect(colors?.brand?.cream).toBe('#F4F1E1')
  })

  it('debe tener definido el color Brand Accent como #C5A059', () => {
    expect(colors?.brand?.accent).toBe('#C5A059')
  })

  it('debe tener definido el color Surface como #FFFFFF', () => {
    expect(colors?.surface).toBe('#FFFFFF')
  })

  it('debe tener definidos los tokens de estado (danger, success, warning)', () => {
    expect(colors?.status?.danger).toBe('#991B1B')
    expect(colors?.status?.success).toBe('#a3e635')
    expect(colors?.status?.warning).toBe('#D97706')
  })

  it('debe tener configuradas las familias tipográficas oficiales (Playfair Display e Inter)', () => {
    expect(fontFamily?.playfair).toContain('"Playfair Display"')
    expect(fontFamily?.inter).toContain('Inter')
  })
})
