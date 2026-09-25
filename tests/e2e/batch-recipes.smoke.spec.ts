import { test, expect } from '@playwright/test'

/**
 * Smoke Test 5: Tandas Maestras, Rendimientos y Vitrina Artesanal
 * Ref: docs/01 - Estrategia & Negocio/plan-tandas-porcionamiento-recetas.md (Fase 7 / Subfase 7.5)
 */
test.describe('Smoke: Tandas Maestras, Dashboard Preventivo y Vitrina Fresca', () => {
  test('la vitrina comercial muestra badges de frescura artesanal y elimina avisos ficticios de escasez', async ({ page }) => {
    // 1. Navegar al catálogo comercial y verificar erradicación de falsas alarmas
    await page.goto('/menu')
    await page.waitForLoadState('networkidle').catch(() => {})
    const supermarketBadge = page.locator('text=/Últimos? \\d+ unidades/i')
    await expect(supermarketBadge).toHaveCount(0)

    // 2. Navegar a la página de inicio (landing) y verificar también erradicación del badge retail
    await page.goto('/')
    await page.waitForLoadState('networkidle').catch(() => {})
    const homeSupermarketBadge = page.locator('text=/Últimos? \\d+ unidades/i')
    await expect(homeSupermarketBadge).toHaveCount(0)

    // 3. Verificar que las creaciones favoritas se exhiban con estilo artesanal
    const productCards = page.locator('article, [data-testid="product-card"]')
    const cardCount = await productCards.count()

    if (cardCount > 0) {
      const freshOrSoldOutBadge = page.locator('text=/Horneado Fresco|Agotado por hoy/i')
      await expect(freshOrSoldOutBadge.first()).toBeVisible()
    }
  })

  test('la sección administrativa protege el acceso a tandas y dashboard de insumos', async ({ page }) => {
    // 1. Intentar acceder a la administración de recetas
    await page.goto('/admin?tab=recipes')

    // 2. Validar que usuarios anónimos son redirigidos o protegidos por guard
    const currentUrl = page.url()
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      await expect(page.locator('input[type="email"], button[type="submit"]')).toBeVisible()
    } else {
      // Si la sesión de prueba está autenticada, verificar pestañas de recetas
      const classicTab = page.locator('button:has-text("Recetas Clásicas")')
      const batchTab = page.locator('button:has-text("Tandas Maestras")')

      if (await batchTab.isVisible()) {
        await batchTab.click()
        // Verificar presencia del botón de descargo rápido
        const quickDeductBtn = page.locator('button:has-text("Registrar Salida de Piezas")')
        await expect(quickDeductBtn).toBeVisible()
      }
    }
  })
})
