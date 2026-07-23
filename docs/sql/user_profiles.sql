-- ==========================================
-- DULCE FE - USER PROFILES & ORDERS SCHEMA
-- ==========================================

-- 1. PROFILES TABLE (Extends Supabase Auth)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    birth_date DATE,
    points INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuarios pueden ver su propio perfil" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. ADDRESSES TABLE
CREATE TABLE public.addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL, -- Ej: 'Casa', 'Oficina'
    address_line TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Políticas para addresses
CREATE POLICY "Usuarios pueden ver sus propias direcciones" 
ON public.addresses FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Usuarios pueden insertar sus propias direcciones" 
ON public.addresses FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Usuarios pueden actualizar sus propias direcciones" 
ON public.addresses FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Usuarios pueden eliminar sus propias direcciones" 
ON public.addresses FOR DELETE USING (auth.uid() = profile_id);


-- 3. ORDERS TABLE (Historial de Pedidos)
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Si borra la cuenta, conservamos el pedido para analíticas
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled')),
    delivery_date TEXT,
    delivery_time TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
CREATE POLICY "Usuarios pueden ver sus propios pedidos" 
ON public.orders FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Usuarios pueden insertar sus propios pedidos" 
ON public.orders FOR INSERT WITH CHECK (auth.uid() = profile_id);


-- 4. ORDER_ITEMS TABLE (Detalle del Pedido)
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL, -- Precio en el momento de la compra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para order_items
CREATE POLICY "Usuarios pueden ver items de sus pedidos" 
ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.profile_id = auth.uid()
    )
);

CREATE POLICY "Usuarios pueden insertar items a sus pedidos" 
ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.profile_id = auth.uid()
    )
);
