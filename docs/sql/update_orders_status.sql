-- 1. Eliminar el constraint anterior
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Añadir el nuevo constraint con el estado 'ready'
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled'));
