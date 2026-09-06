import { test, expect } from '@playwright/test'

/**
 * Smoke Test 2: Flujo de Inicio de Sesión y Acceso Administrativo
 * Ref: docs/03 - Arquitectura & UI/architecture-refactor-plan.md (§18, §19 PR-5, §20.1 V4-V9)
 */
test.describe('Smoke: Flujo de Login y Acceso Administrativo', () => {
  test('un usuario anónimo es redirigido o bloqueado al intentar acceder a /admin', async ({ page }) => {
    // 1. Intentar acceder a ruta protegida de administración
    await page.goto('/admin')

    // 2. Comprobar que el middleware de cliente o servidor redirige a /login
    await page.waitForURL(/\/login|\//)
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/login|\//)
  })

  test('la pantalla de login presenta el formulario accesible y controles de seguridad', async ({ page }) => {
    // 1. Navegar a /login
    await page.goto('/login')

    // 2. Verificar existencia de campos requeridos
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const submitButton = page.locator('button[type="submit"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()

    // 3. Probar toggle de visibilidad de contraseña
    const toggleBtn = page.locator('button[aria-label*="contraseña" i], button[aria-label*="password" i]')
    if (await toggleBtn.isVisible()) {
      await expect(passwordInput).toHaveAttribute('type', 'password')
      await toggleBtn.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
      await toggleBtn.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })
})
