# Registro de Decisiones de Arquitectura (ADRs) — Dulce Fe

Este directorio almacena el registro histórico e inmutable de decisiones técnicas, compensaciones de diseño (*trade-offs*) y gestión de deuda técnica del proyecto **Dulce Fe**, adoptando el estándar internacional **MADR (Markdown Architectural Decision Records)**.

Conforme al Plan Maestro de Refactorización (`docs/03 - Arquitectura & UI/architecture-refactor-plan.md`, §10.5 y §20.5), ninguna deuda técnica se "olvida": se identifica, se bautiza y se documenta formalmente para que el equipo conozca las razones de ingeniería detrás de cada compromiso.

---

## Índice de Decisiones (Deudas D1 a D8)

| ADR | Código | Título | Estado | Condición de Reapertura |
|---|---|---|---|---|
| [ADR-001](./ADR-001-cancellation-stock-reversal.md) | **D1** | Reversión de stock al cancelar pedidos post-processing | **Aceptado / Postergado** | Reglas de merma con el dueño de pastelería + RPC compensatorio. |
| [ADR-002](./ADR-002-guest-order-tracking.md) | **D2** | Tracking de pedidos para invitados mediante tokens criptográficos | **Aceptado / Postergado** | Feature de producto `/pedido/[token]`. |
| [ADR-003](./ADR-003-pinia-cart-vs-db-cart.md) | **D3** | Carrito efímero en cliente (Pinia + cookies) vs tablas en base de datos | **Aceptado** | Requerimiento de persistencia multi-dispositivo sin cuenta. |
| [ADR-004](./ADR-004-catalog-display-stock.md) | **D4** | Desacoplamiento de `products.stock` e inventario real por materias primas | **Aceptado** | Rediseño de catálogo con sincronización predictiva de insumos. |
| [ADR-005](./ADR-005-payment-gateways.md) | **D5** | Estrategia de pasarela de pagos: WhatsApp vs pasarelas integradas | **Aceptado / Postergado** | Integración de pasarelas automáticas (Yape, Plin, Niubiz, Stripe). |
| [ADR-006](./ADR-006-external-integrations-scope.md) | **D6** | Alcance del monolito Nuxt frente a servicios satélite (n8n, KDS, microservicios) | **Aceptado** | Escalamiento de volumen operativo o demanda de pantalla de cocina KDS. |
| [ADR-007](./ADR-007-completed-order-immutability.md) | **D7** | Inmutabilidad de pedidos completados y asignación definitiva de puntos | **Aceptado** | Nunca (salvo apertura legal de notas de crédito formales). |
| [ADR-008](./ADR-008-recipe-versioning.md) | **D8** | Versionado de escandallo de recetas al confirmar pedidos | **Aceptado / Postergado** | Auditoría de costeo histórico retrospectivo y fluctuación inflacionaria. |

---

## Estructura de un ADR (MADR 3.0.0)

Cada archivo documenta:
1. **Contexto y Problema:** Qué necesidad técnica o de negocio motivó la decisión.
2. **Factores Decisivos (Decision Drivers):** Qué restricciones (seguridad, simplicidad, tiempo, dinero) gobernaron la elección.
3. **Opciones Consideradas:** Alternativas analizadas con pros y contras.
4. **Decisión Adoptada:** La alternativa elegida y su justificación.
5. **Consecuencias:** Efectos positivos, negativos y mitigaciones operativas.
6. **Condiciones de Reapertura:** Qué evento o hito de producto justifica revisar esta decisión.
