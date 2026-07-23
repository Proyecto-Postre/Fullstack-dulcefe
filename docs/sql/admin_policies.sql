-- ==========================================
-- POLÍTICAS DE ADMINISTRADOR PARA PEDIDOS
-- ==========================================

-- 1. Permitir al administrador VER todos los pedidos
DROP POLICY IF EXISTS "Admin puede ver todos los pedidos" ON public.orders;
CREATE POLICY "Admin puede ver todos los pedidos" 
ON public.orders FOR SELECT 
USING (auth.jwt() ->> 'email' IN ('jynga@ankasafi.com', 'jafethworren@gmail.com'));

-- 2. Permitir al administrador ACTUALIZAR todos los pedidos (para moverlos en el Kanban)
DROP POLICY IF EXISTS "Admin puede actualizar todos los pedidos" ON public.orders;
CREATE POLICY "Admin puede actualizar todos los pedidos" 
ON public.orders FOR UPDATE 
USING (auth.jwt() ->> 'email' IN ('jynga@ankasafi.com', 'jafethworren@gmail.com'));

-- 3. Permitir al administrador VER todos los items de los pedidos
DROP POLICY IF EXISTS "Admin puede ver todos los items de pedidos" ON public.order_items;
CREATE POLICY "Admin puede ver todos los items de pedidos" 
ON public.order_items FOR SELECT 
USING (auth.jwt() ->> 'email' IN ('jynga@ankasafi.com', 'jafethworren@gmail.com'));

-- 4. Permitir al administrador VER todos los perfiles (para ver el nombre del cliente en el Kanban)
DROP POLICY IF EXISTS "Admin puede ver todos los perfiles" ON public.profiles;
CREATE POLICY "Admin puede ver todos los perfiles" 
ON public.profiles FOR SELECT 
USING (auth.jwt() ->> 'email' IN ('jynga@ankasafi.com', 'jafethworren@gmail.com'));
