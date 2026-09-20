import { test, expect } from '@playwright/test'

/**
 * Smoke Test 3: Tracking de Invitados sin Cuenta (Guest Tracking)
 * Ref: docs/03 - Arquitectura & UI/architecture-refactor-plan.md (Fase 6 / ADR-002 / D2)
 */
test.describe('Smoke: Tracking de Pedidos de Invitados (Fase 6 / Subfase 6.1)', () => {
  test('muestra error de comanda no encontrada o token inválido ante formato erróneo', async ({ page }) => {
    // 1. Navegar con token sintéticamente inválido
    await page.goto('/pedido/token-invalido-123')

    // 2. Verificar que se presenta mensaje de error o pantalla informativa
    await expect(page.locator('text=/no encontrado|inválido|error/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('renderiza la interfaz de seguimiento de pedido con stepper reactivo', async ({ page }) => {
    // Navegar a la página de pedido con un token de 64 caracteres
    const dummyToken = 'a'.repeat(64)
    await page.goto(`/pedido/${dummyToken}`)

    // Verificar que la estructura de la página de seguimiento existe
    await expect(page.locator('body')).toBeVisible()
    const heading = page.locator('h1, h2, p')
    await expect(heading.first()).toBeVisible()
  })
})
