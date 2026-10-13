-- Migración: Vinculación de Productos a Categorías de Catálogo
-- Agrega columna category_id a la tabla products apuntando a categories(id)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

COMMENT ON COLUMN public.products.category_id IS 'Identificador de la categoría a la que pertenece el producto para filtrado comercial.';
