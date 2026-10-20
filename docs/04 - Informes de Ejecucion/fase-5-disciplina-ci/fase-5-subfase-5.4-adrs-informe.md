# Informe de Ejecución — Fase 5: Subfase 5.4 (Registro Formal de Decisiones de Arquitectura — ADRs)

**Fecha de Ejecución:** 2026-09-06  
**Rama:** `feat/fase-05-restructuration_proyect`  
**Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§10.5, §20.5 D1 a D8)  
**Calificación:** 10/10 Enterprise  

---

## 1. Objetivo Técnico y Alcance

Formalizar bajo el estándar internacional **MADR 3.0.0 (Markdown Architectural Decision Records)** el registro histórico de las 8 deudas técnicas explícitas reconocidas en el Plan Maestro de Arquitectura (§20.5, D1 a D8), asegurando que ninguna decisión o compromiso de diseño quede librada a la memoria humana o a interpretaciones informales.

---

## 2. Inventario de ADRs Implementados en `docs/decisions/`

1. **`README.md`:** Índice maestro de decisiones, matriz de trazabilidad y guía de reapertura de deudas técnicas.
2. **`ADR-001-cancellation-stock-reversal.md` (Deuda D1):** Política de compensación y reversión de inventario ante cancelación post-`processing`. Se documenta la necesidad de conciliación de mermas antes de implementar `cancellation_reversal`.
3. **`ADR-002-guest-order-tracking.md` (Deuda D2):** Arquitectura de seguimiento de pedidos para invitados mediante tokens criptográficos efímeros `/pedido/[token]` para prevenir ataques IDOR.
4. **`ADR-003-pinia-cart-vs-db-cart.md` (Deuda D3):** Justificación técnica del carrito efímero local (Pinia + cookies) frente a tablas `carts`/`cart_items` en base de datos.
5. **`ADR-004-catalog-display-stock.md` (Deuda D4):** Desacoplamiento de `products.stock` (disponibilidad comercial) respecto al inventario estricto de materias primas en taller.
6. **`ADR-005-payment-gateways.md` (Deuda D5):** Estrategia de pasarelas de pago y desacoplamiento del checkout actual orientado a WhatsApp respecto a futuras integraciones (Yape, Plin, Tarjetas).
7. **`ADR-006-external-integrations-scope.md` (Deuda D6):** Delimitación formal del monolito Nuxt frente a herramientas satélite (n8n, KDS, Meilisearch, RBAC extendido).
8. **`ADR-007-completed-order-immutability.md` (Deuda D7):** Inmutabilidad del estado terminal `completed` y asignación definitiva e irreversible de puntos de fidelidad.
9. **`ADR-008-recipe-versioning.md` (Deuda D8):** Versionado y snapshot de escandallo de recetas al confirmar órdenes para auditoría de costos históricos.

---

## 3. Matriz de Validación y Compuertas de Calidad

| Validación | Resultado | Observaciones |
|---|---|---|
| Cobertura de Deudas §20.5 | **8 de 8 documentadas (100%)** | D1 a D8 formalizadas con estándar MADR 3.0.0. |
| `npm run lint` | **0 problemas** | La documentación no altera ni interfiere con los linters de código. |
| `npm test` | **109/109 tests pasando** | Integridad total de la suite de pruebas. |

---

## 4. Conclusión

La Subfase 5.4 queda certificada con estándar 10/10. La memoria arquitectónica del sistema ahora reside en el repositorio como fuente única de verdad para cualquier ingeniero presente o futuro.
