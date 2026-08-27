---
tipo: adr
numero: 006
titulo: Estado de Carrito Híbrido (Pinia + Cookies en Cliente vs Tablas BD)
fecha: 2026-08-26
estado: aceptado
relacionado:
  - "[[plan-maestro]]"
  - "[[sql/README]]"
---

# 🏛️ ADR-006: Carrito en Cliente con Pinia y Cookies vs Persistencia en DB

## 1. Contexto & Problema
Persistir el carrito de compras en una tabla de base de datos para cada visitante anónimo genera millones de escrituras innecesarias, bloqueos de conexión y necesidad de cron jobs de limpieza de carritos abandonados.

## 2. Decisión Tomada
1. **Carrito en Cliente:** El carrito de compras opera 100% en memoria reactiva con Pinia en el frontend, sincronizado en `Cookie` / `localStorage`.
2. **Desactivación de Tablas de Carrito:** Se archiva `cart_tables.sql` en `docs/sql/` como script histórico deprecado.
3. **Persistencia solo en Checkout:** Solo cuando el cliente confirma la compra se crea la orden formal en la tabla `orders`.

## 3. Consecuencias
* **Impacto:** 0 carga en la base de datos durante la navegación de usuarios anónimos y carrito ultrarrápido sin latencia de red.
