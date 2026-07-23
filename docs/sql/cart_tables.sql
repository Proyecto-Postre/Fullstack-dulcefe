-- Crear tabla de carritos (carts)
CREATE TABLE public.carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id) -- Un usuario solo puede tener un carrito activo
);

-- Crear tabla de items del carrito (cart_items)
CREATE TABLE public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE NOT NULL,
    product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cart_id, product_id) -- Un producto no puede estar duplicado en el mismo carrito
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Políticas para carts
CREATE POLICY "Usuarios pueden ver su propio carrito"
    ON public.carts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear su propio carrito"
    ON public.carts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su propio carrito"
    ON public.carts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su propio carrito"
    ON public.carts FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para cart_items
CREATE POLICY "Usuarios pueden ver los items de su carrito"
    ON public.cart_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden agregar items a su carrito"
    ON public.cart_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden actualizar items de su carrito"
    ON public.cart_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden eliminar items de su carrito"
    ON public.cart_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

-- Función para actualizar el updated_at del carrito cuando se modifican items
CREATE OR REPLACE FUNCTION update_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.carts
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.cart_id OR id = OLD.cart_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp del carrito
CREATE TRIGGER update_cart_timestamp_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION update_cart_timestamp();
