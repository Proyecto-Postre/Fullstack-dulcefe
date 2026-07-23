-- ==========================================
-- DULCE FE - INVENTORY TRIGGER RPC
-- ==========================================

-- Función para descontar inventario cuando un pedido pasa a "Horneando" (processing)
CREATE OR REPLACE FUNCTION public.process_order_inventory(order_uuid UUID)
RETURNS void AS $$
DECLARE
    item RECORD;
    recipe_row RECORD;
    total_needed DECIMAL;
BEGIN
    -- Iterar sobre cada producto en el pedido
    FOR item IN 
        SELECT product_id, quantity 
        FROM public.order_items 
        WHERE order_id = order_uuid
    LOOP
        -- Iterar sobre la receta de ese producto
        FOR recipe_row IN 
            SELECT raw_material_id, quantity_required 
            FROM public.recipe_items 
            WHERE product_id = item.product_id
        LOOP
            -- Calcular la cantidad total de insumo necesaria
            total_needed := recipe_row.quantity_required * item.quantity;
            
            -- Restar del stock en raw_materials
            UPDATE public.raw_materials
            SET stock = stock - total_needed,
                updated_at = NOW()
            WHERE id = recipe_row.raw_material_id;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
