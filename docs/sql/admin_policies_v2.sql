-- ==========================================
-- ACTUALIZACIÓN A SISTEMA DE ROLES (IS_ADMIN)
-- ==========================================

-- 1. Añadir la columna is_admin a la tabla profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 1.5 Sincronizar usuarios antiguos (por si tu cuenta admin se creó antes de configurar los perfiles)
INSERT INTO public.profiles (id, full_name, is_admin)
SELECT id, raw_user_meta_data->>'full_name', false
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
);

-- 2. Hacer admin a tu usuario actual automáticamente
-- Reemplaza el correo si usas otro
UPDATE public.profiles 
SET is_admin = true 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'jafethworren@gmail.com'
);

-- 3. Crear una función segura para verificar si el usuario es admin (evita bucles infinitos en RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT is_admin FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Borrar las políticas anteriores basadas en correo
DROP POLICY IF EXISTS "Admin puede ver todos los pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admin puede actualizar todos los pedidos" ON public.orders;
DROP POLICY IF EXISTS "Admin puede ver todos los items de pedidos" ON public.order_items;
DROP POLICY IF EXISTS "Admin puede ver todos los perfiles" ON public.profiles;

-- 5. Crear las nuevas políticas basadas en el rol dinámico
CREATE POLICY "Admin puede ver todos los pedidos" 
ON public.orders FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin puede actualizar todos los pedidos" 
ON public.orders FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin puede ver todos los items de pedidos" 
ON public.order_items FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin puede ver todos los perfiles" 
ON public.profiles FOR SELECT USING (public.is_admin());
