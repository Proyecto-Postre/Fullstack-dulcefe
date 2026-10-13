export type AdminTab = 'dashboard' | 'products' | 'categories' | 'materials' | 'recipes' | 'orders'

export const TAB_TO_SLUG: Record<AdminTab, string> = {
  dashboard: 'dashboard',
  products: 'vitrina',
  categories: 'categorias',
  materials: 'almacen',
  recipes: 'escandallo',
  orders: 'pedidos'
}

export const SLUG_TO_TAB: Record<string, AdminTab> = {
  dashboard: 'dashboard',
  vitrina: 'products',
  products: 'products',
  categorias: 'categories',
  categories: 'categories',
  almacen: 'materials',
  materials: 'materials',
  escandallo: 'recipes',
  recipes: 'recipes',
  pedidos: 'orders',
  orders: 'orders'
}

export const useAdminTab = () => useState<AdminTab>('adminCurrentTab', () => 'dashboard')
export const useAdminMobileMenu = () => useState<boolean>('adminMobileMenuOpen', () => false)

