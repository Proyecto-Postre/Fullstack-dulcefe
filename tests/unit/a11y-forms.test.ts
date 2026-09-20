import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Form Accessibility & WCAG 2.1 AA Compliance (V43 / §10.9)', () => {
  const componentsDir = path.resolve(__dirname, '../../app/components')
  const pagesDir = path.resolve(__dirname, '../../app/pages')

  it('1. CheckoutCustomerForm.vue debe vincular labels con inputs y definir aria-required (§10.9)', () => {
    const filePath = path.join(componentsDir, 'checkout/CheckoutCustomerForm.vue')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Vinculación estricta label for <-> input id
    expect(content).toContain('for="checkout-customer-name"')
    expect(content).toContain('id="checkout-customer-name"')

    expect(content).toContain('for="checkout-customer-phone"')
    expect(content).toContain('id="checkout-customer-phone"')

    expect(content).toContain('for="checkout-customer-address"')
    expect(content).toContain('id="checkout-customer-address"')

    // Atributos de accesibilidad de formulario
    expect(content).toContain('aria-required="true"')
    expect(content).toContain('autocomplete="name"')
    expect(content).toContain('autocomplete="tel"')
    expect(content).toContain('autocomplete="street-address"')

    // Anillos de foco visibles para navegación por teclado
    expect(content).toContain('focus-visible:ring-2')
  })

  it('2. login.vue debe cumplir con autocompletado, toggle accesible y alertas de error en vivo (V43)', () => {
    const filePath = path.join(pagesDir, 'login.vue')
    const content = fs.readFileSync(filePath, 'utf-8')

    // Labels e inputs asociados
    expect(content).toContain('for="email"')
    expect(content).toContain('id="email"')
    expect(content).toContain('for="password"')
    expect(content).toContain('id="password"')

    // Atributos accesibles
    expect(content).toContain('autocomplete="email"')
    expect(content).toContain('aria-label="Alternar visibilidad de contraseña"')
    expect(content).toContain('role="alert"')
    expect(content).toContain('aria-live="assertive"')

    // Foco visible
    expect(content).toContain('focus:ring-2')
  })

  it('3. Modales de administración deben tener semántica de diálogo y cierre accesible (§10.9)', () => {
    const modals = [
      { name: 'MaterialModal.vue', path: path.join(componentsDir, 'admin/MaterialModal.vue'), titleId: 'modal-material-title' },
      { name: 'ProductModal.vue', path: path.join(componentsDir, 'admin/ProductModal.vue'), titleId: 'modal-product-title' },
      { name: 'NewOrderModal.vue', path: path.join(componentsDir, 'admin/NewOrderModal.vue'), titleId: 'modal-new-order-title' }
    ]

    for (const modal of modals) {
      const content = fs.readFileSync(modal.path, 'utf-8')

      expect(content, `${modal.name} debe tener role="dialog"`).toContain('role="dialog"')
      expect(content, `${modal.name} debe tener aria-modal="true"`).toContain('aria-modal="true"')
      expect(content, `${modal.name} debe vincular aria-labelledby con ${modal.titleId}`).toContain(`aria-labelledby="${modal.titleId}"`)
      expect(content, `${modal.name} debe tener el ID ${modal.titleId}`).toContain(`id="${modal.titleId}"`)
      expect(content, `${modal.name} debe tener aria-label en el botón de cerrar`).toContain('aria-label=')
    }
  })
})
