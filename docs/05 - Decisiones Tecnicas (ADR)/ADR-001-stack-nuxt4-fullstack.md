---
tipo: adr
numero: 001
titulo: Elección de Arquitectura Monolito Modular Nuxt 4 Fullstack
fecha: 2026-08-26
estado: aceptado
autores: Equipo de Desarrollo Dulce Fe
relacionado:
  - "[[plan-maestro]]"
  - "[[architecture-refactor-plan]]"
---

# 🏛️ ADR-001: Monolito Modular con Nuxt 4 vs Frontend y Backend Separados

## 1. Contexto & Problema
Necesitamos construir una plataforma que combine dos mundos:
1. **Tienda E-Commerce pública:** Requiere excelente SEO, carga ultrarrápida y renderizado del lado del servidor (SSR).
2. **Panel ERP Administrativo:** Requiere reactividad en tiempo real para gestionar recetas, almacén y pedidos.

Teníamos la disyuntiva de crear dos proyectos separados (un Backend en Express/NestJS y un Frontend en React/Vue) o unificar todo en un **Monolito Modular Fullstack**.

---

## 2. Opciones Evaluadas

### Opción A: Frontend (SPA) + Backend Separado (Express / NestJS)
* **Ventajas:** Desacoplamiento total entre capas.
* **Desventajas:** Duplicación de interfaces TypeScript, mayor latencia de red, configuración de dos pipelines de CI/CD y despliegues independientes en servidores separados (mayor costo).

### Opción B: Nuxt 4 Fullstack con Nitro Engine & BFF (Elegida)
* **Ventajas:** 
  * Un solo repositorio (Single Source of Truth) con tipos de TypeScript compartidos al 100%.
  * SSR nativo para el catálogo público y SPA reactivo para el panel `/admin`.
  * Nitro Server Engine actúa como **Backend-For-Frontend (BFF)** con 0ms de latencia interna y despliegue unificado sin costo adicional de servidores.
* **Desventajas:** Requiere disciplina para no mezclar lógica de cliente en el servidor.

---

## 3. Decisión Tomada
Se aprueba **Nuxt 4 (Vue 3.5 + TypeScript + Nitro)** como framework fullstack unificado.

---

## 4. Consecuencias y Plan de Escalabilidad
* **Impacto Positivo:** Reducción del 50% en tiempo de desarrollo; tipado estricto entre frontend y backend sin herramientas externas.
* **Mitigación a Futuro:** Si en el futuro se crea una App Móvil en Flutter o React Native, la carpeta `server/api/` ya está estructurada como API REST estándar y puede exponerse directamente sin refactorizar la lógica de negocio.
