# ADR-006: Delimitación del Monolito Nuxt frente a Servicios Satélite — n8n, KDS, RBAC 4 Roles y Meilisearch (Deuda D6)

* **Estado:** Aceptado
* **Fecha:** 2026-09-06
* **Decisores:** Equipo de Arquitectura Dulce Fe
* **Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§1, §5, §10.5, §20.5 D6)

---

## 1. Contexto y Problema

Durante fases tempranas de ideación del proyecto se contemplaron múltiples subsistemas periféricos:
- Pantalla de Cocina para Taller (KDS — Kitchen Display System).
- Flujos de automatización de marketing y alertas en n8n.
- Motor de búsqueda dedicado (Meilisearch).
- Personalizador 3D de pasteles a medida (Custom Cake Builder).
- Control de acceso RBAC extendido a 4 roles (Superadmin, Pastelero, Despachador, Vendedor).

Intentar implementar o acoplar estos subsistemas dentro del monolito durante el refactor de arquitectura dispersaría el foco, aumentaría exponencialmente la complejidad de mantenimiento y diluiría la entrega del núcleo operativo.

---

## 2. Factores Decisivos (Decision Drivers)

1. **Enfoque en el Core:** El núcleo prioritario es la estabilidad de la venta, el costeo exacto de escandallo, el inventario de materias primas y la seguridad de datos.
2. **Arquitectura Limpia y Monolítica:** Un monolito modular Nuxt 4 + Supabase es la arquitectura óptima para la escala actual del negocio.
3. **Mantenibilidad:** Evitar dependencias de infraestructura que requieran servidores o clústeres adicionales sin justificación de volumen.

---

## 3. Opciones Consideradas

* **Opción A:** Diseñar una arquitectura de microservicios o incorporar Meilisearch y n8n dentro del despliegue del proyecto. *(Descartada por sobreingeniería y costos operativos innecesarios).*
* **Opción B (Adoptada):** Delimitar el monolito Nuxt 4 como única aplicación desplegable; excluir KDS, n8n, RBAC de 4 roles y Meilisearch del alcance del presente refactor (Deuda D6).

---

## 4. Decisión Adoptada

Se adopta la **Opción B**. 
* El sistema opera con 2 niveles de acceso claros y seguros: Usuario Cliente y Administrador (`is_admin()`).
* El catálogo utiliza búsqueda relacional indexada en PostgreSQL.
* Cuando surjan necesidades de automatización externa (ej. alertas n8n hacia WhatsApp del pastelero), se integrarán como consumidores externos vía webhooks o API Keys de lectura limitada, sin contaminar el código base del monolito.

---

## 5. Consecuencias

### Positivas
* Velocidad de compilación, simplicidad de despliegue en Vercel y cero costos de servidores auxiliares.
* Base de código homogénea, predecible y fácil de auditar.

### Negativas / Deuda Técnica
* Operaciones de cocina complejas o búsquedas difusas multilingües avanzadas se apoyan en el shell de administración actual.

---

## 6. Condiciones de Reapertura

Cualquiera de estos componentes se evaluará como un proyecto independiente bajo el Plan Maestro cuando la pastelería escale su producción física a más de un taller o requiera estaciones de trabajo separadas.
