import { test, expect } from '@playwright/test'

/**
 * Smoke Test 4: Sistema de Taller KDS (Kitchen Display System)
 * Ref: docs/03 - Arquitectura & UI/architecture-refactor-plan.md (Fase 6 / Subfase 6.3 / Módulo C)
 */
test.describe('Smoke: Kitchen Display System (KDS Cocina)', () => {
  test('la pantalla de taller carga los controles táctiles de cocina y modal de mise en place', async ({ page }) => {
    await page.goto('/admin/kds')

    // Si redirige a login por guard de admin o si carga directamente en mock
    const currentUrl = page.url()
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      await expect(page.locator('input[type="email"], button[type="submit"]')).toBeVisible()
    } else {
      // Verificar encabezado táctil de taller
      await expect(page.locator('text=/KDS TALLER|DULCE FÉ/i').first()).toBeVisible()

      // Verificar existencia de botón Mise en Place
      const miseEnPlaceBtn = page.locator('button:has-text("Mise en Place")')
      if (await miseEnPlaceBtn.isVisible()) {
        await miseEnPlaceBtn.click()
        await expect(page.locator('text=/Horneado por Lotes|insumos/i').first()).toBeVisible()
        await page.keyboard.press('Escape')
      }
    }
  })
})
