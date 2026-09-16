# 🍰 Dulce Fe — Pastelería Artesanal

> **Plataforma Integral E-Commerce, ERP de Producción & Kitchen Display System (KDS)**  
> Desarrollado con **Nuxt 4**, **Vue 3.5**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL / RLS)** y **Nitro Engine**.

[![Tests](https://img.shields.io/badge/tests-201%20passing-success.svg)](#-pruebas-y-calidad)
[![TypeScript](https://img.shields.io/badge/typescript-strict%20100%25-blue.svg)](#-arquitectura-técnica)
[![WCAG](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-green.svg)](#-diseño-y-experiencia-de-usuario)
[![Status](https://img.shields.io/badge/status-Enterprise%2010%2F10-gold.svg)](#-documentación-y-segundo-cerebro)

---

## 🌟 Descripción General

**Dulce Fe** es una solución tecnológica integral de grado empresarial diseñada para pastelerías artesanales. Combina una experiencia de compra pública intuitiva y cálida con un potente sistema de gestión interna (ERP) para control de inventarios, escandallos de costos en gramos/mililitros, seguimiento en cocina en tiempo real y conciliación de pagos.

---

## 🚀 Características Principales

### 🛒 Tienda Pública & E-Commerce
* **Catálogo Dinámico:** Vitrina de postres organizada por categorías dinámicas desde base de datos, con búsqueda en tiempo real y animación de cuadrícula FLIP a 60 fps sin parpadeos.
* **Carrito en Cliente:** Gestión 100% en cliente con Pinia y persistencia en Cookies, eliminando la necesidad de tablas intermedias en BD.
* **Guest Checkout:** Permite a los clientes comprar sin necesidad de registrarse previamente, maximizando la tasa de conversión.
* **Validación Celular Perú:** Validación estricta en vivo para números móviles peruanos (9 dígitos iniciando con 9) con bandera SVG integrada.
* **Pagos Perú (Yape & Plin):** Pasarela de pago QR con carga segura de comprobantes mediante validación de Magic Bytes y confirmación en 1-click.
* **Guest Tracking:** Seguimiento de pedidos para invitados protegido criptográficamente mediante tokens HMAC-SHA256 (Ley 29733 de Protección de Datos Personales).

### 📊 Panel de Administración & ERP
* **Dashboard Operativo:** Resumen ejecutivo de valor del almacén, productos en vitrina, insumos registrados y alertas de stock crítico.
* **Carrusel Táctil Mobile:** Carrusel de métricas suave con `snap-x` y desplazamiento horizontal exclusivo (`container.scrollTo`) inmune a tirones de pantalla.
* **Pestañas Segmentadas Móviles:** Control segmentado táctil que reduce la longitud de scroll vertical en un 50%.
* **Gestión de Pedidos (Kanban & Tabla):** Administración de estados de pedidos (`PENDIENTE`, `PAGADO`, `EN_COCINA`, `LISTO`, `ENTREGADO`, `CANCELADO`).
* **Almacén & Kardex de Insumos:** Control de compras por volumen, stock en tiempo real, deducción atómica de materias primas y registro de mermas.
* **Escandallo de Costos & Fórmulas Vivas:** Costeo exacto en gramos/mililitros, mano de obra, CIF y margen comercial con exportación viva a Excel (`.xlsx`).
* **Kitchen Display System (KDS):** Pantalla táctil para cocina con semáforos de urgencia y mise en place por lotes.
* **Deep Linking & Persistencia F5:** Sincronización bidireccional entre la URL (`?tab=...`) y el estado del panel administrativo sin recargas forzadas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Framework Fullstack** | [Nuxt 4](https://nuxt.com/) (Vue 3.5) | Monolito modular SSR/SPA de alto rendimiento |
| **Motor de Servidor** | [Nitro Engine](https://nitro.unjs.io/) | API endpoints tipados, validación de schemas y streaming |
| **Lenguaje** | [TypeScript 5](https://www.typescriptlang.org/) | Tipado estricto al 100%, cero tipos `any` |
| **Estilos & UI** | [Tailwind CSS 3](https://tailwindcss.com/) + CSS Scoped | Design tokens personalizados, paleta orgánica y responsive |
| **Base de Datos & Auth** | [Supabase](https://supabase.com/) (PostgreSQL) | RLS granular, autenticación JWT y almacenamiento seguro |
| **Estado Global** | [Pinia](https://pinia.vuejs.org/) | Tiendas de catálogo, carrito, autenticación y pedidos |
| **Testing** | [Vitest](https://vitest.dev/) | 30 suites de prueba unitarias, de integración y arquitectura |
| **Automatización** | [n8n](https://n8n.io/) | Webhooks asíncronos firmados con HMAC-SHA256 para WhatsApp |

---

## 📦 Instalación y Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Proyecto-Postre/Fullstack-dulcefe.git
cd Fullstack-dulcefe
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`:
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
N8N_WEBHOOK_URL=https://n8n.tu-dominio.pe/webhook
N8N_WEBHOOK_SECRET=tu-secreto-hmac-sha256
APP_URL=http://localhost:3000
```

### 4. Iniciar el servidor de desarrollo
* **Desarrollo en PC local:**
  ```bash
  npm run dev
  ```
  Accede a `http://localhost:3000`.

* **Pruebas en Smartphones en red Wi-Fi:**
  ```bash
  npm run dev:host
  ```
  Permite probar la aplicación en teléfonos reales en tu red local (ejemplo: `http://192.168.100.8:3000`).

---

## 🧪 Pruebas y Calidad de Código

El proyecto cuenta con una sólida disciplina de ingeniería y gobernanza:

```bash
# Ejecutar suite completa de pruebas unitarias y de arquitectura (30 suites, 201 tests)
npm test

# Validación estricta de tipos TypeScript
npm run typecheck

# Linter de código (ESLint 10 Flat Config)
npm run lint

# Compilación de producción
npm run build
```

---

## 📂 Estructura del Proyecto

```
fullstack_dulcefe/
├── app/                      # Código Frontend Nuxt 4
│   ├── components/           # Componentes organizados por dominio
│   │   ├── admin/            # Tabs del ERP (Dashboard, Pedidos, Insumos, Recetas, Vitrina)
│   │   ├── catalog/          # Vitrina y filtros dinámicos con FLIP
│   │   ├── checkout/         # Formularios de compra y validación celular
│   │   ├── common/           # Header, Footer, Drawer y modales
│   │   └── profile/          # Gestión de perfil y direcciones
│   ├── composables/          # Lógica reactiva reutilizable y desacoplada
│   ├── layouts/              # Layouts: default (tienda), admin (ERP) y auth (login/registro)
│   ├── pages/                # Vistas enrutadas de la aplicación
│   └── stores/               # Stores reactivos de Pinia
├── server/                   # Backend Nitro Engine
│   ├── api/                  # Endpoints REST organizados por dominio
│   │   ├── admin/            # Endpoints exclusivos de administración y KDS
│   │   ├── auth/             # Endpoints de autenticación y perfil
│   │   ├── categories/       # Categorías dinámicas de catálogo
│   │   ├── checkout/         # Checkout transaccional y carga de comprobantes
│   │   ├── orders/           # Tracking criptográfico de pedidos
│   │   ├── products/         # Catálogo público de productos
│   │   ├── raw-materials/    # Kardex y almacén de materias primas
│   │   └── recipes/          # Escandallos y exportación ExcelJS
│   └── utils/                # Servicios de dominio, seguridad y validaciones
├── supabase/
│   └── migrations/           # Migraciones SQL oficiales versionadas
├── tests/                    # Suites de pruebas automatizadas (Vitest)
└── docs/                     # Segundo Cerebro (Base de Conocimiento SSOT)
```

---

## 🧠 Documentación y Segundo Cerebro

Toda la arquitectura, decisiones de diseño, algoritmos de costeo y playbooks operativos están exhaustivamente documentados en formato **Obsidian** dentro de la carpeta [`docs/`](./docs/):

* 📊 **[Centro de Comando (Dashboard)](./docs/Dashboard.md):** Mapa interactivo de todo el sistema.
* 🎯 **[01 - Estrategia & Negocio](./docs/01%20-%20Estrategia%20&%20Negocio/):** Plan maestro, reglas de negocio y fórmulas de costeo.
* ⚡ **[02 - Backend & Datos](./docs/02%20-%20Backend%20&%20Datos/):** Catálogo de endpoints y esquema de base de datos PostgreSQL.
* 🏛️ **[03 - Arquitectura & UI](./docs/03%20-%20Arquitectura%20&%20UI/):** Tokens de diseño, arquitectura de componentes y guía de diseño móvil responsivo.
* 📝 **[04 - Informes de Ejecución](./docs/04%20-%20Informes%20de%20Ejecucion/):** Registro histórico inmutable de auditorías y avances por fase.
* 🛡️ **[05 - Operaciones](./docs/05%20-%20Operaciones/):** Playbook de misión crítica, rotación de claves y resiliencia.
* ⚖️ **[decisions/ (ADRs)](./docs/decisions/):** Registro formal de Decisiones de Arquitectura bajo formato MADR 3.0.0.

---

## 📄 Licencia

Este proyecto es propiedad privada de **Dulce Fe**. Todos los derechos reservados.
