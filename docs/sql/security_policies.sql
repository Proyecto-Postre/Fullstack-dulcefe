-- Habilitar RLS en las tablas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Políticas para PRODUCTS (Catálogo)
-- ==========================================
-- 1. Lectura pública (Cualquiera puede ver el catálogo en la tienda)
CREATE POLICY "Lectura publica de productos"
    ON public.products FOR SELECT
    USING (true);

-- 2. Modificación solo para usuarios autenticados (Admins)
CREATE POLICY "Solo admins pueden insertar productos"
    ON public.products FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden actualizar productos"
    ON public.products FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden eliminar productos"
    ON public.products FOR DELETE
    USING (auth.role() = 'authenticated');

-- ==========================================
-- Políticas para RAW_MATERIALS (Almacén)
-- ==========================================
-- Solo admins pueden leer y modificar. Los clientes no ven esto.
CREATE POLICY "Solo admins pueden ver insumos"
    ON public.raw_materials FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden insertar insumos"
    ON public.raw_materials FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden actualizar insumos"
    ON public.raw_materials FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden eliminar insumos"
    ON public.raw_materials FOR DELETE
    USING (auth.role() = 'authenticated');

-- ==========================================
-- Políticas para RECIPE_ITEMS (Escandallos)
-- ==========================================
-- Solo admins pueden leer y modificar.
CREATE POLICY "Solo admins pueden ver recetas"
    ON public.recipe_items FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden insertar recetas"
    ON public.recipe_items FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden actualizar recetas"
    ON public.recipe_items FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Solo admins pueden eliminar recetas"
    ON public.recipe_items FOR DELETE
    USING (auth.role() = 'authenticated');
