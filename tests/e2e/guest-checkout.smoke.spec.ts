import { test, expect } from '@playwright/test'

/**
 * Smoke Test 1: Flujo de Checkout de Invitado (Guest Checkout)
 * Ref: docs/03 - Arquitectura & UI/architecture-refactor-plan.md (§18, §19 PR-5, §20.3 V17-V23, V36)
 */
test.describe('Smoke: Flujo de Checkout de Invitado', () => {
  test('un usuario invitado puede navegar al checkout, completar sus datos y preparar su orden', async ({ page }) => {
    // 1. Navegar al catálogo público
    await page.goto('/menu')
    await expect(page).toHaveTitle(/Dulce Fe|Menú/i)

    // 2. Navegar a la página de checkout
    await page.goto('/checkout')
    await expect(page.locator('h1, h2')).toContainText(/checkout|pedido|finalizar/i)

    // 3. Validar presencia de formulario accesible de cliente
    const nameInput = page.locator('#customer-name')
    await expect(nameInput).toBeVisible()

    // 4. Llenar información de contacto como invitado
    await nameInput.fill('Valeria Gómez')

    const phoneInput = page.locator('#customer-phone')
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('987654321')
    }

    // 5. Seleccionar método de entrega si aplica
    const addressInput = page.locator('#customer-address')
    if (await addressInput.isVisible()) {
      await addressInput.fill('Calle Las Begonias 320, San Isidro')
    }

    // 6. Verificar que el botón de confirmación existe y tiene estado coherente
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
  })
})
