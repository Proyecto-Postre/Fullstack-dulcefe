---
tipo: adr
numero: 004
titulo: Motor de Costeo y Escandallo por Gramos con Fórmulas Vivas en ExcelJS
fecha: 2026-08-26
estado: aceptado
relacionado:
  - "[[formulas-costeo]]"
  - "[[api-endpoints]]"
---

# 🏛️ ADR-004: Escandallo en Unidad Mínima y Generación de Excel en Servidor

## 1. Contexto & Problema
Los insumos se compran en bultos (sacos de 50kg, litros, cajas), pero las recetas usan gramos/ml. Además, la dueña del negocio necesita auditar y descargar las recetas a Excel sin perder las fórmulas matemáticas de cálculo.

## 2. Decisión Tomada
1. **Normalización a Unidad Mínima:** El backend calcula el costo unitario por gramo/ml al momento de registrar el insumo (`purchase_price / purchase_quantity`).
2. **Exportación con ExcelJS:** En lugar de exportar un simple CSV estático o JSON, el endpoint `/api/recipes/export` genera un libro `.xlsx` con **fórmulas vivas de Excel** (`=SUM(...)`, `=C4*D4`, `=F4-G4`) ejecutado en el servidor Nitro sin congelar el navegador.

## 3. Consecuencias
* **Impacto:** Precisión de 4 decimales en costo real por porción y entrega de reportes ejecutivos listos para contabilidad.
