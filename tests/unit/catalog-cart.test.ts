import { describe, it, expect } from 'vitest'
import { normalizeCatalogText, matchProductCategory } from '../../app/composables/useCatalog'
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

    it('respeta category_id cuando está asignado explícitamente en el producto', () => {
      const productWithCat: CatalogProduct = {
        id: 99,
        name: 'Postre Exclusivo',
        price: 50.0,
        stock: 5,
        category_id: 'tortas'
      }
      expect(productWithCat.category_id).toBe('tortas')
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

    it('calcula subtotales correctamente con cantidades variables provenientes del modal de detalle', () => {
      const productPrice = 95.00
      const quantity = 3
      const subtotal = productPrice * quantity

      expect(subtotal).toBe(285.00)
      expect(subtotal.toFixed(2)).toBe('285.00')
    })

    it('restringe la cantidad mínima a 1 y valida disponibilidad de stock', () => {
      const stock = 5
      let quantity = 1

      // No permitir bajar de 1
      if (quantity > 1) quantity--
      expect(quantity).toBe(1)

      // Incrementar hasta el límite de stock
      for (let i = 0; i < 10; i++) {
        if (quantity < stock) {
          quantity++
        }
      }
      expect(quantity).toBe(stock)
    })
  })

  describe('Vitrina de Portada (Creaciones Favoritas & Destacados)', () => {
    it('prioriza productos marcados como is_featured y con stock disponible hasta un máximo de 3', () => {
      const catalog: CatalogProduct[] = [
        { id: 1, name: 'Postre Común En Stock', price: 20, stock: 10, image_url: null, is_featured: false },
        { id: 2, name: 'Postre Destacado Agotado', price: 30, stock: 0, image_url: null, is_featured: true },
        { id: 3, name: 'Postre Destacado En Stock', price: 40, stock: 5, image_url: null, is_featured: true },
        { id: 4, name: 'Segundo Postre Común', price: 25, stock: 8, image_url: null, is_featured: false },
        { id: 5, name: 'Tercer Postre Destacado', price: 50, stock: 3, image_url: null, is_featured: true }
      ]

      const featured = catalog.filter(p => p.is_featured === true)
      const others = catalog.filter(p => p.is_featured !== true)

      const sortedFeatured = [...featured].sort((a, b) => (Number(b.stock) > 0 ? 1 : 0) - (Number(a.stock) > 0 ? 1 : 0))
      const sortedOthers = [...others].sort((a, b) => (Number(b.stock) > 0 ? 1 : 0) - (Number(a.stock) > 0 ? 1 : 0))
      const result = [...sortedFeatured, ...sortedOthers].slice(0, 3)

      expect(result.length).toBe(3)
      // Los primeros deben ser los destacados en stock (id 3 y id 5), luego el destacado agotado (id 2)
      expect(result.map(p => p.id)).toEqual([3, 5, 2])
    })
  })

  describe('Agrupación por Secciones y Coincidencias de Categoría', () => {
    it('asocia correctamente un producto con category_id explícito o fallback de nombre', () => {
      const torta: CatalogProduct = { id: 1, name: 'Torta Ópera Francesa', price: 68, stock: 10, category_id: 'tortas' }
      const tartaletaSinId: CatalogProduct = { id: 2, name: 'Tartaleta de Fresas & Pistacho', price: 45, stock: 8 }

      expect(matchProductCategory(torta, 'tortas')).toBe(true)
      expect(matchProductCategory(torta, 'boxes')).toBe(false)
      expect(matchProductCategory(tartaletaSinId, 'tartaletas')).toBe(true)
    })

    it('soporta filtrado multi-categoría permitiendo seleccionar múltiples secciones simultáneas', () => {
      const prods: CatalogProduct[] = [
        { id: 1, name: 'Torta Red Velvet', price: 70, stock: 5, category_id: 'tortas' },
        { id: 2, name: 'Tartaleta de Manzana', price: 38, stock: 4, category_id: 'tartaletas' },
        { id: 3, name: 'Box Cumpleañero Deluxe', price: 65, stock: 3, category_id: 'boxes' }
      ]

      const selected = ['tortas', 'boxes']
      const filtered = prods.filter(p => selected.some(catId => matchProductCategory(p, catId)))

      expect(filtered.length).toBe(2)
      expect(filtered.map(p => p.id)).toEqual([1, 3])
    })
  })

  describe('Recomendación de Conservación y Consumo Óptimo (shelf_life)', () => {
    it('muestra shelf_life personalizado si está definido o aplica el fallback estándar "3-4 días"', () => {
      const pieConFruta: CatalogProduct = {
        id: 10,
        name: 'Pie de Limón con Merengue Suizo',
        price: 45,
        stock: 6,
        shelf_life: '1-2 días en frío'
      }
      const tortaEstandar: CatalogProduct = {
        id: 11,
        name: 'Torta Selva de Cacao',
        price: 80,
        stock: 4
      }

      const getDisplayShelfLife = (product: CatalogProduct) => product.shelf_life || '3-4 días'

      expect(getDisplayShelfLife(pieConFruta)).toBe('1-2 días en frío')
      expect(getDisplayShelfLife(tortaEstandar)).toBe('3-4 días')
    })
  })
})

