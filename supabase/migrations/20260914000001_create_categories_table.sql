-- Migración: Tabla de Categorías de Catálogo (Fase Refinamiento UI)
-- Permite dinamizar las categorías desde la base de datos Supabase.
-- Si la tabla está vacía, el catálogo no renderiza píldoras de categoría.

CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'lucide:sparkles' NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública: cualquier visitante puede leer categorías activas
CREATE POLICY "Public read active categories" ON public.categories
    FOR SELECT
    USING (is_active = true);

-- Política administrativa: administradores pueden gestionar categorías
CREATE POLICY "Admin manage categories" ON public.categories
    FOR ALL
    USING (public.is_admin());

COMMENT ON TABLE public.categories IS 'Categorías del catálogo de postres. Si no hay registros, la vitrina oculta las píldoras.';
