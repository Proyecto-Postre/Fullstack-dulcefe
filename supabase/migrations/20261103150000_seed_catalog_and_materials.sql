-- ============================================================================
-- MIGRACIÓN: Sincronización de Insumos Reales, Categorías y Catálogo Comercial Notion
-- Fecha: 2026-11-03
-- 1. Limpia órdenes y productos dummy de prueba anteriores.
-- 2. Limpia categorías obsoletas y materias primas dummy temporales.
-- 3. Preserva y sincroniza los 23 insumos reales de producción + nuevos complementarios.
-- 4. Inserta las 5 categorías oficiales de vitrina.
-- 5. Inserta el catálogo comercial de 51 postres y bocaditos de Notion.
-- 6. Sincroniza secuencias de claves primarias.
-- ============================================================================

-- 1. LIMPIEZA DE TRANSACCIONES Y PRODUCTOS DUMMY PREVIOS
DELETE FROM public.order_items;
DELETE FROM public.inventory_movements;
DELETE FROM public.piece_waste_logs;
DELETE FROM public.checkout_idempotency_keys;
DELETE FROM public.orders;

DELETE FROM public.product_packaging_items;
DELETE FROM public.product_recipe_mappings;
DELETE FROM public.recipe_items;

DELETE FROM public.products;
ALTER SEQUENCE IF EXISTS public.products_id_seq RESTART WITH 1;

-- 2. LIMPIEZA DE CATEGORÍAS OBSOLETAS E INSUMOS TEMPORALES
DELETE FROM public.categories WHERE id NOT IN ('bocaditos-eventos', 'postres-individuales', 'cuchareables', 'tortas-y-pies', 'cajas-degustacion');
DELETE FROM public.raw_materials WHERE id < 10;

-- 3. CATEGORÍAS OFICIALES DE VITRINA
INSERT INTO public.categories (id, name, icon, sort_order, is_active)
VALUES
  ('bocaditos-eventos', 'Bocaditos & Eventos', 'lucide:party-popper', 1, true),
  ('postres-individuales', 'Postres & Porciones', 'lucide:cake-slice', 2, true),
  ('cuchareables', 'Cuchareables en Vaso', 'lucide:cup-soda', 3, true),
  ('tortas-y-pies', 'Tortas, Pies & Kekes', 'lucide:cake', 4, true),
  ('cajas-degustacion', 'Cajas & Surtidos', 'lucide:gift', 5, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- 4. MATERIAS PRIMAS E INSUMOS (Sincronización PROD IDs 10..32 + Complementarios IDs 33..43)
INSERT INTO public.raw_materials (id, name, unit, purchase_price, purchase_quantity, stock, type)
VALUES
  (10, 'Harina', 'kg', 4.00, 1.0000, 10.0000, 'ingredient'),
  (11, 'Maicena', 'kg', 6.00, 1.0000, 10.0000, 'ingredient'),
  (12, 'Margarina', 'kg', 30.00, 2.0000, 10.0000, 'ingredient'),
  (13, 'Leche', 'l', 5.50, 1.0000, 10.0000, 'ingredient'),
  (14, 'Azúcar en polvo', 'kg', 8.00, 1.0000, 10.0000, 'ingredient'),
  (15, 'Azúcar rubia', 'kg', 4.00, 1.0000, 10.0000, 'ingredient'),
  (16, 'Azúcar blanca', 'kg', 4.50, 1.0000, 10.0000, 'ingredient'),
  (17, 'Polvo de hornear', 'g', 3.00, 100.0000, 500.0000, 'ingredient'),
  (18, 'Levadura instantánea', 'g', 4.00, 100.0000, 300.0000, 'ingredient'),
  (19, 'Canela en polvo', 'g', 4.00, 100.0000, 200.0000, 'ingredient'),
  (20, 'Huevo', 'und', 8.00, 16.0000, 48.0000, 'ingredient'),
  (21, 'Sal', 'kg', 2.00, 1.0000, 5.0000, 'ingredient'),
  (22, 'Cocoa', 'kg', 50.00, 1.0000, 5.0000, 'ingredient'),
  (23, 'Bicarbonato de sodio', 'g', 5.00, 100.0000, 300.0000, 'ingredient'),
  (24, 'Chantilly', 'l', 16.00, 1.0000, 5.0000, 'ingredient'),
  (25, 'Esencia de vainilla', 'l', 10.00, 1.0000, 3.0000, 'ingredient'),
  (26, 'Manjar blanco', 'kg', 11.00, 1.0000, 10.0000, 'ingredient'),
  (27, 'Fudge', 'kg', 11.00, 1.0000, 10.0000, 'ingredient'),
  (28, 'Chocolate (bloque)', 'kg', 16.00, 1.0000, 10.0000, 'ingredient'),
  (29, 'Chispas de chocolate', 'kg', 16.00, 1.0000, 10.0000, 'ingredient'),
  (30, 'Caja Torta / Pastel 25x25cm', 'und', 25.00, 10.0000, 20.0000, 'packaging'),
  (31, 'Bolsa Kraft Dulce Fe (Mediana)', 'und', 15.00, 25.0000, 50.0000, 'packaging'),
  (32, 'Domo Transparente Individual', 'und', 18.00, 20.0000, 40.0000, 'packaging'),
  (33, 'Mantequilla para hojaldre', 'kg', 22.00, 1.0000, 5.0000, 'ingredient'),
  (34, 'Manteca vegetal', 'kg', 9.00, 1.0000, 5.0000, 'ingredient'),
  (35, 'Manzana caña o Israel', 'kg', 3.50, 1.0000, 10.0000, 'ingredient'),
  (36, 'Jamón inglés / sandwich', 'kg', 22.00, 1.0000, 5.0000, 'ingredient'),
  (37, 'Queso Dambo / Paria', 'kg', 28.00, 1.0000, 5.0000, 'ingredient'),
  (38, 'Carne molida especial', 'kg', 20.00, 1.0000, 5.0000, 'ingredient'),
  (39, 'Pechuga de pollo deshuesada', 'kg', 16.00, 1.0000, 5.0000, 'ingredient'),
  (40, 'Cebolla roja criolla', 'kg', 2.50, 1.0000, 5.0000, 'ingredient'),
  (41, 'Pan de molde Pullman', 'und', 8.00, 24.0000, 10.0000, 'ingredient'),
  (42, 'Caja de bocaditos x25/50', 'und', 13.00, 25.0000, 50.0000, 'packaging'),
  (43, 'Pirotines de repostería', 'und', 4.00, 100.0000, 200.0000, 'packaging')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  purchase_price = EXCLUDED.purchase_price,
  purchase_quantity = EXCLUDED.purchase_quantity,
  type = EXCLUDED.type;

SELECT setval(pg_get_serial_sequence('public.raw_materials', 'id'), COALESCE((SELECT MAX(id) FROM public.raw_materials), 43));

-- 5. CATÁLOGO COMERCIAL EN VITRINA (PUBLIC.PRODUCTS)
INSERT INTO public.products (id, name, price, stock, category_id, description, shelf_life, portions, is_featured)
VALUES
  (1, 'Mini Alfajores Clásicos (Caja x25)', 18.00, 15, 'bocaditos-eventos', 'Delicadas tapitas de maicena rellenas de generoso manjar blanco artesanal y lluvia de azúcar impalpable.', '4-5 días', 25, true),
  (2, 'Mini Alfajores Clásicos (Caja x50)', 32.00, 10, 'bocaditos-eventos', 'Presentación para celebraciones y mesas dulces. Tapitas extra suaves que se deshacen en boca.', '4-5 días', 50, false),
  (3, 'Mini Alfajores Clásicos (Caja x100)', 60.00, 5, 'bocaditos-eventos', 'Formato catering para eventos masivos y recepciones con abundante relleno tradicional.', '4-5 días', 100, false),
  (4, 'Mini Alfajores con Chocochip (Caja x25)', 23.00, 15, 'bocaditos-eventos', 'Masa suave de alfajor con chispas de cacao horneadas y relleno de manjar blanco o fudge.', '4-5 días', 25, false),
  (5, 'Mini Alfajores con Chocochip (Caja x50)', 42.00, 10, 'bocaditos-eventos', 'Bandeja para eventos con equilibrio perfecto entre cacao al 55% y dulce de leche.', '4-5 días', 50, false),
  (6, 'Mini Alfajores con Chocochip (Caja x100)', 80.00, 5, 'bocaditos-eventos', 'Formato completo para eventos y mesas gourmet.', '4-5 días', 100, false),
  (7, 'Empanaditas Cocktail de Carne (Caja x25)', 32.00, 10, 'bocaditos-eventos', 'Masa horneada artesanal con relleno criollo de carne seleccionada, cebolla caramelizada y toque de especias.', '1-2 días', 25, true),
  (8, 'Empanaditas Cocktail de Carne (Caja x50)', 60.00, 6, 'bocaditos-eventos', 'Bandeja x50 de empanaditas calientes listas para servir en recepciones y cocteles.', '1-2 días', 50, false),
  (9, 'Empanaditas Cocktail de Pollo (Caja x25)', 32.00, 10, 'bocaditos-eventos', 'Pechuga de pollo deshilachada en suave sofrito criollo y masa crocante horneada al punto.', '1-2 días', 25, false),
  (10, 'Empanaditas Cocktail de Pollo (Caja x50)', 60.00, 6, 'bocaditos-eventos', 'Empanaditas cocktail de pechuga de pollo deshilachada en presentación x50.', '1-2 días', 50, false),
  (11, 'Empanaditas Mixtas de Hojaldre (Caja x25)', 23.00, 12, 'bocaditos-eventos', 'Masa de milhojas laminada con mantequilla pura, rellena de jamón inglés y queso fundido.', '1-2 días', 25, false),
  (12, 'Empanaditas Mixtas de Hojaldre (Caja x50)', 40.00, 8, 'bocaditos-eventos', 'Empanaditas de hojaldre crocante y queso derretido en bandeja x50.', '1-2 días', 50, false),
  (13, 'Empanaditas Mixtas de Hojaldre (Caja x100)', 75.00, 5, 'bocaditos-eventos', 'Formato institucional para catering de hojaldre salado.', '1-2 días', 100, false),
  (14, 'Mini Triples Clásicos (Caja x25)', 38.00, 10, 'bocaditos-eventos', 'Pan de molde fresco sin corteza, jamón seleccionado, queso dambo y mayonesa de la casa.', '1 día en frío', 25, false),
  (15, 'Mini Triples Clásicos (Caja x50)', 70.00, 6, 'bocaditos-eventos', 'Bandeja x50 de triples clásicos frescos para recepciones y cocteles.', '1 día en frío', 50, false),
  (16, 'Mini Triples Clásicos (Caja x100)', 130.00, 3, 'bocaditos-eventos', 'Presentación catering para grandes recepciones.', '1 día en frío', 100, false),
  (17, 'Mini Triples Premium (Caja x25)', 50.00, 10, 'bocaditos-eventos', 'Combinación especial de pollo deshilachado con palta fresca y tomate en rodajas finas.', '1 día en frío', 25, false),
  (18, 'Mini Triples Premium (Caja x50)', 90.00, 6, 'bocaditos-eventos', 'Bandeja x50 de mini triples premium frescos.', '1 día en frío', 50, false),
  (19, 'Mini Triples Premium (Caja x100)', 170.00, 3, 'bocaditos-eventos', 'Formato completo para eventos de gala y corporativos.', '1 día en frío', 100, false),
  (20, 'Orejitas de Hojaldre (Caja x25)', 22.00, 15, 'bocaditos-eventos', 'Hojaldre crujiente caramelizado con azúcar fina y horneado en capas doradas.', '5-7 días', 25, false),
  (21, 'Orejitas de Hojaldre (Caja x50)', 40.00, 10, 'bocaditos-eventos', 'Bandeja x50 de orejitas tradicionales crocantes.', '5-7 días', 50, false),
  (22, 'Mini Brownies Melcochudos (Caja x25)', 25.00, 12, 'bocaditos-eventos', 'Bocaditos de chocolate intenso al 60% con textura melcochuda y corteza crocante.', '4-5 días', 25, true),
  (23, 'Mini Brownies Melcochudos (Caja x50)', 48.00, 8, 'bocaditos-eventos', 'Bandeja x50 de mini brownies para eventos y barras de postres.', '4-5 días', 50, false),
  (24, 'Mini Galletas Surtidas (Caja x25)', 15.00, 15, 'bocaditos-eventos', 'Variedad de mini galletas: chocochip, avena con pasas y mantequilla con limón.', '5-7 días', 25, false),
  (25, 'Mini Galletas Surtidas (Caja x50)', 28.00, 10, 'bocaditos-eventos', 'Bandeja x50 surtida para compartir en reuniones y celebraciones.', '5-7 días', 50, false),
  (26, 'Combo Bocaditos Surtidos (Pack x50)', 55.00, 8, 'bocaditos-eventos', 'Selección equilibrada de 25 salados (empanaditas y triples) y 25 dulces (alfajorcitos y brownies).', '1-2 días', 50, true),
  (27, 'Alfajores Tradicionales Grandes (Caja x12)', 15.00, 12, 'postres-individuales', 'Caja de 12 alfajores de tamaño regular rellenos de manjar blanco casero.', '4-5 días', 12, true),
  (28, 'Alfajores con Chocochip Grandes (Caja x12)', 18.00, 12, 'postres-individuales', 'Masa quebradiza con chispas de cacao y corazón de manjar blanco.', '4-5 días', 12, false),
  (29, 'Galletas Chocochip Estilo Taller (Caja x12)', 15.00, 12, 'postres-individuales', 'Galletas horneadas con mantequilla pura, azúcar rubia y abundantes chispas de chocolate.', '5-7 días', 12, true),
  (30, 'Galletas de Avena con Pasas (Caja x12)', 15.00, 12, 'postres-individuales', 'Galletas crocantes con hojuelas de avena tostada, pasas rubias y canela aromática.', '5-7 días', 12, false),
  (31, 'Galletas Glaseadas de Limón (Caja x12)', 15.00, 12, 'postres-individuales', 'Suaves galletas con zumo natural de limón y fino glaseado cítrico.', '5-7 días', 12, false),
  (32, 'Pastisetas de Mantequilla (Caja x12)', 15.00, 12, 'postres-individuales', 'Galletas de manga con textura suave y corona de mermelada fina.', '5-7 días', 12, false),
  (33, 'Brownie Clásico de Chocolate (Caja x4)', 22.00, 10, 'postres-individuales', 'Cuatro cuadrados generosos de brownie melcochudo con cacao puro.', '4-5 días', 4, true),
  (34, 'Brownie Clásico de Chocolate (Caja x9)', 45.00, 6, 'postres-individuales', 'Caja familiar de 9 brownies densos y chocolatudos para los amantes del buen cacao.', '4-5 días', 9, false),
  (35, 'Rol de Canela Artesanal (Unidad)', 6.00, 20, 'postres-individuales', 'Masa brioche esponjosa enrollada con canela aromática, azúcar rubia y glaseado suave.', '2-3 días', 1, false),
  (36, 'Roles de Canela Artesanales (Caja x4)', 24.00, 10, 'postres-individuales', 'Caja de 4 roles grandes glaseados, ideales para calentar y disfrutar al momento.', '2-3 días', 4, true),
  (37, 'Roles de Canela Artesanales (Caja x6)', 34.00, 8, 'postres-individuales', 'Presentación de 6 unidades para compartir en familia o merienda.', '2-3 días', 6, false),
  (38, 'Mini Roles de Canela (Caja x12)', 24.00, 10, 'cajas-degustacion', 'Doce bocados de rol de canela con glaseado cremoso.', '2-3 días', 12, false),
  (39, 'Mini Roles de Canela (Caja x25)', 48.00, 6, 'cajas-degustacion', 'Bandeja de 25 mini roles cocktail para reuniones de té y desayunos corporativos.', '2-3 días', 25, false),
  (40, 'Mini Pai de Manzana (Caja x12)', 25.00, 10, 'cajas-degustacion', 'Tartaletas con masa sableé, compota casera de manzana a la canela y enrejado dorado.', '2-3 días', 12, true),
  (41, 'Mini Pai de Manzana (Caja x25)', 48.00, 6, 'cajas-degustacion', 'Bandeja x25 de mini pies individuales.', '2-3 días', 25, false),
  (42, 'Mini Pai de Manzana (Caja x50)', 92.00, 4, 'cajas-degustacion', 'Presentación mayorista para banquetes.', '2-3 días', 50, false),
  (43, 'Mini Tartaletas de Fruta (Caja x12)', 25.00, 10, 'cajas-degustacion', 'Masa sableé crujiente con crema pastelera aromatizada a la vainilla y frutas frescas.', '1-2 días en frío', 12, true),
  (44, 'Mini Tartaletas de Fruta (Caja x25)', 48.00, 6, 'cajas-degustacion', 'Surtido de tartaletas de fresas frescas y maracuyá.', '1-2 días en frío', 25, false),
  (45, 'Mini Tartaletas de Fruta (Caja x50)', 92.00, 4, 'cajas-degustacion', 'Bandeja x50 de tartaletas de fruta fresca para cócteles.', '1-2 días en frío', 50, false),
  (46, 'Pai de Manzana Familiar (Molde 24 cm)', 45.00, 5, 'tortas-y-pies', 'Receta clásica en molde entero con compota de manzanas seleccionadas y crujiente masa horneada.', '3-4 días', 8, true),
  (47, 'Vaso Tres Leches Tradicional', 12.00, 15, 'cuchareables', 'Bizcochuelo aireado bañado en mezcla de tres leches y coronado con canela molida.', '2-3 días en frío', 1, true),
  (48, 'Vaso Selva Negra Artesanal', 14.00, 12, 'cuchareables', 'Capas de bizcochuelo de chocolate húmedo, crema chantilly fresca, cerezas y virutas de chocolate.', '2-3 días en frío', 1, false),
  (49, 'Vaso Mokka', 12.00, 12, 'cuchareables', 'Armonía de café espresso recién pasado y chocolate con suave crema batida.', '2-3 días en frío', 1, false),
  (50, 'Vaso Red Velvet Suave', 14.00, 12, 'cuchareables', 'Bizcocho aterciopelado con sutil toque de cacao y capas de frosting de queso crema.', '2-3 días en frío', 1, false),
  (51, 'Vaso Chocolate Húmedo', 12.00, 15, 'cuchareables', 'Torta de chocolate húmeda intercalada con fudge artesanal de olla.', '2-3 días en frío', 1, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  category_id = EXCLUDED.category_id,
  description = EXCLUDED.description,
  shelf_life = EXCLUDED.shelf_life,
  portions = EXCLUDED.portions,
  is_featured = EXCLUDED.is_featured;

SELECT setval(pg_get_serial_sequence('public.products', 'id'), COALESCE((SELECT MAX(id) FROM public.products), 51));
