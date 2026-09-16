export type AdminTab = 'dashboard' | 'products' | 'materials' | 'recipes' | 'orders'

export const useAdminTab = () => useState<AdminTab>('adminCurrentTab', () => 'dashboard')
export const useAdminMobileMenu = () => useState<boolean>('adminMobileMenuOpen', () => false)
