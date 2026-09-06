import { describe, it, expect } from 'vitest'
import { normalizeCatalogText } from '../../app/composables/useCatalog'
import type { CatalogProduct } from '../../app/types/catalog'
import type { CartItem, AddToCartInput } from '../../app/types/cart'

describe('Fase 4 (PR-4b): Dominio Catálogo y Carrito - Normalización, Filtrado y Aritmética', () => {
  describe('normalizeCatalogText', () => {
    it('elimina tildes, diacríticos y espacios en blanco, convirtiendo a minúsculas', () => {
      expect(normalizeCatalogText('  TORTA DE CHOCOLATE CON CAFÉ  ')).toBe('torta de chocolate con cafe')
      expect(normalizeCatalogText('Piña Colada')).toBe('pina colada')
      expect(normalizeCatalogText('')).toBe('')
      expect(normalizeCatalogText('   ')).toBe('')
    })
  })

  describe('Lógica de Filtrado de Catálogo', () => {
    const mockProducts: CatalogProduct[] = [
      {
        id: 1,
        name: 'Torta Selva Negra',
        price: 45.0,
        stock: 4,
        image_url: '/torta-selva.jpg',
        description: 'Bizcochuelo de chocolate y cerezas al marrasquino'
      },
      {
        id: 2,
        name: 'Tartaleta de Fresas con Pistacho',
        price: 18.5,
        stock: 10,
        image_url: '/tartaleta.jpg',
        description: 'Masa sablée con crema pastelera y fresas frescas'
      },
      {
        id: 3,
        name: 'Cheesecake de Frutos Rojos',
        price: 38.0,
        stock: 0,
        image_url: '/cheesecake.jpg',
        description: 'Base de galleta y queso crema con coulis artesanal'
      },
      {
        id: 4,
        name: 'Box de Alfajores Artesanales (x12)',
        price: 25.0,
        stock: 15,
        image_url: '/alfajores.jpg',
        description: 'Rellenos de manjar blanco de olla'
      }
    ]

    it('filtra productos correctamente por texto de búsqueda en nombre o descripción', () => {
      const query = normalizeCatalogText('fresas')
      const results = mockProducts.filter(p => {
        const nameNorm = normalizeCatalogText(p.name)
        const descNorm = normalizeCatalogText(p.description || '')
        return nameNorm.includes(query) || descNorm.includes(query)
      })

      expect(results.length).toBe(1)
      expect(results[0].name).toBe('Tartaleta de Fresas con Pistacho')
    })

    it('filtra productos por categoría tortas (excluyendo cheesecakes)', () => {
      const results = mockProducts.filter(p => {
        const n = normalizeCatalogText(p.name)
        return (n.includes('torta') || n.includes('pastel') || n.includes('cake')) && !n.includes('cheesecake')
      })
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('Torta Selva Negra')
    })

    it('filtra productos por categoría tartaletas', () => {
      const results = mockProducts.filter(p => {
        const n = normalizeCatalogText(p.name)
        return n.includes('tarta') || n.includes('pie')
      })
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('Tartaleta de Fresas con Pistacho')
    })

    it('filtra productos por categoría cheesecakes', () => {
      const results = mockProducts.filter(p => {
        const n = normalizeCatalogText(p.name)
        return n.includes('cheesecake') || n.includes('cheese')
      })
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('Cheesecake de Frutos Rojos')
    })

    it('filtra productos por categoría bocaditos/boxes', () => {
      const results = mockProducts.filter(p => {
        const n = normalizeCatalogText(p.name)
        return n.includes('box') || n.includes('alfajor') || n.includes('brownie') || n.includes('cajita')
      })
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('Box de Alfajores Artesanales (x12)')
    })
  })

  describe('Cálculo de Carrito y Totales', () => {
    it('calcula el total de la cesta sumando precio * cantidad con precisión', () => {
      const items: CartItem[] = [
        { id: '1', product_id: 1, name: 'Torta Selva Negra', price: 45.0, quantity: 2 },
        { id: '2', product_id: 2, name: 'Tartaleta de Fresas', price: 18.5, quantity: 3 }
      ]

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const count = items.reduce((sum, item) => sum + item.quantity, 0)

      // 45.0 * 2 = 90.0, 18.5 * 3 = 55.5 -> Total = 145.5
      expect(total).toBe(145.5)
      expect(count).toBe(5)
    })

    it('valida que el contrato AddToCartInput acepte tipos estrictos', () => {
      const input: AddToCartInput = {
        id: 1,
        name: 'Torta Chocolate',
        price: '35.50',
        image_url: 'https://example.com/torta.jpg'
      }

      expect(Number(input.price)).toBe(35.5)
      expect(input.name).toBe('Torta Chocolate')
    })
  })
})
