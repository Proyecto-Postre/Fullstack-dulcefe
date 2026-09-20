# Playbook de Operaciones, Resiliencia y Observabilidad — Dulce Fe

**Versión:** 1.0.0 (Enterprise)  
**Fecha de Emisión:** 2026-09-06  
**Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§10.7, §10.8, §15, §20.4 V44)  
**Destino de Infraestructura:** Vercel (Frontend & Serverless Nitro) + Supabase (PostgreSQL 15, Auth, Storage)  

---

## 1. Matriz de Variables de Entorno y Configuración

Toda variable debe gestionarse a través del panel de configuración de Vercel y el archivo local `.env`. Prohibido hardcodear llaves o URLs en `nuxt.config.ts` o en código fuente.

| Variable | Descripción | Ámbito / Nivel | Local | Staging | Producción |
|---|---|---|---|---|---|
| `SUPABASE_URL` | URL de la instancia Supabase | Público / Runtime | `http://127.0.0.1:54321` | `https://[staging].supabase.co` | `https://rklxfrwzuwjvnfcdhmei.supabase.co` |
| `SUPABASE_KEY` | Llave anónima (`anon_key`) con RLS | Público / Frontend | Token local generado | Token staging anon | Token producción anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave de administración con bypass RLS | **Estrictamente Privado** | Token local service | Token staging service | Token producción service |
| `NUXT_PUBLIC_WHATSAPP_NUMBER` | Teléfono oficial de confirmación | Público / Cliente | `51998265700` | `51998265700` | `51998265700` |
| `NUXT_PUBLIC_SITE_URL` | Dominio base para Origin y CORS | Público / Runtime | `http://localhost:3000` | `https://staging.dulcefe.com` | `https://dulcefe.com` |

---

## 2. Protocolo de Rotación de Credenciales (Zero-Downtime Key Rollover)

### 2.1 Rotación de `SUPABASE_SERVICE_ROLE_KEY`
1. **Paso 1 (Supabase):** Ingresar al Dashboard de Supabase en `Settings -> API`. Generar una llave secundaria (*Roll-over secret* si el plan lo soporta) o planificar ventana de baja actividad (ej. 03:00 AM UTC-5).
2. **Paso 2 (Vercel):** Actualizar la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` en el proyecto Vercel para el entorno objetivo.
3. **Paso 3 (Redeploy):** Ejecutar un redespliegue atómico en Vercel (*Promote Deployment* o `git push`).
4. **Paso 4 (Verificación):** Comprobar que `/api/products` y `/api/checkout` respondan normalmente.
5. **Paso 5 (Revocación):** Revocar la llave antigua en Supabase una vez verificado el tráfico entrante sin errores 401.

---

## 3. Estrategia de Respaldo y Ensayo de Restauración (Runbook V44)

> [!IMPORTANT]
> **Regla de oro de ingeniería (§10.8):** Tener respaldos sin un procedimiento de restauración probado y ensayado en Staging es equivalente a no tener respaldos.

### 3.1 Política de Respaldos
* **PITR (Point-in-Time Recovery):** Habilitado en la base de datos de producción con retención mínima de 7 días.
* **Dumps Lógicos Semanales:** Ejecución programada los domingos a las 02:00 AM UTC-5 mediante Supabase CLI:
  ```bash
  supabase db dump --project-ref rklxfrwzuwjvnfcdhmei -f backup_dulcefe_$(date +%Y%m%d).sql
  ```

### 3.2 Procedimiento de Ensayo de Restauración en Staging (Paso a Paso)
1. **Descarga del Respaldo:**
   ```bash
   # Descarga del snapshot más reciente desde Supabase
   supabase db dump --project-ref rklxfrwzuwjvnfcdhmei --data-only > /tmp/prod_backup_data.sql
   ```
2. **Sanitización de PII (Privacidad de Datos):**
   Antes de importar en Staging, anonimizar teléfonos y nombres de clientes reales:
   ```sql
   -- Script de sanitización para Staging
   UPDATE orders SET 
     customer_name = 'Cliente Sanitize ' || substr(id::text, 1, 6),
     customer_phone = '999000000',
     address = 'Dirección de Prueba Staging';
   UPDATE profiles SET 
     phone = '999000000',
     full_name = 'Usuario Staging ' || substr(id::text, 1, 6);
   ```
3. **Limpieza e Importación en Staging:**
   ```bash
   # Aplicar sobre el proyecto de Staging
   psql "$STAGING_DATABASE_URL" -f /tmp/prod_backup_data.sql
   ```
4. **Comprobación de Integridad Post-Restauración:**
   - Ejecutar la suite de pruebas contra Staging: `npm test`.
   - Verificar integridad de claves foráneas entre `orders` y `order_items`.
   - Validar que los disparadores de inventario (`process_order_inventory`) y auditoría (`audit_events`) se encuentren activos y operativos.

---

## 4. Política de Despliegues y Procedimiento de Rollback en Vercel

### 4.1 Ciclo Git-Ops
* Rama `feat/*`: Ramas de desarrollo con previews automáticos efímeros en Vercel.
* Rama `dev`: Entorno de Integración y Staging. Despliegue automático tras aprobación de CI.
* Rama `main`: Entorno de Producción Oficial. Exige Pull Request aprobado y verificación de checklist §20.

### 4.2 Procedimiento de Rollback Inmediato (Instant Rollback)
En caso de fallo crítico en producción (error 5xx recurrente en checkout, corrupción de datos o problema de seguridad):
1. Ingresar al panel de **Vercel -> Deployments**.
2. Identificar el último despliegue estable previo al incidente.
3. Hacer clic en los tres puntos contextuales (`...`) y seleccionar **"Instant Rollback"** o **"Promote to Production"**.
4. Tiempo promedio de propagación: **< 15 segundos** a nivel global.
5. Iniciar investigación post-mortem en rama aislada sin presión de servicio caído.

---

## 5. Observabilidad, Telemetría y Alertas del Checkout (§10.7)

### 5.1 Estructura Estándar de Logs
Todos los endpoints críticos en `server/` emiten telemetría estructurada en formato JSON compatible con Vercel Log Drains y datadog/cloudwatch:
```json
{
  "timestamp": "2026-09-06T20:15:30.123Z",
  "level": "error",
  "request_id": "b9a341e0-6a1e-4581-9659-cb14777e4e42",
  "path": "/api/checkout",
  "method": "POST",
  "status_code": 409,
  "error_code": "INSUFFICIENT_STOCK",
  "duration_ms": 48
}
```

> [!CAUTION]
> **Minimización de PII:** Prohibido terminantemente registrar en los logs de producción contraseñas, tokens JWT, payloads íntegros de tarjeta o direcciones residenciales.

### 5.2 Catálogo de Alertas Críticas

| Alerta | Condición de Disparo | Severidad | Acción Inmediata |
|---|---|---|---|
| **Checkout 5xx Spike** | > 3 errores HTTP 500 en ventana de 5 minutos en `/api/checkout` | **P1 (Crítica)** | Revisar logs de Vercel por fallo de conexión a Supabase o error de sintaxis en `order.service.ts`. Rollback si persiste. |
| **Quiebre de Insumos (`INSUFFICIENT_STOCK`)** | > 2 órdenes rechazadas consecutivas por falta de insumos | **P2 (Alta)** | Notificar al administrador de taller para reabastecimiento urgente de almacén o congelar producto en catálogo. |
| **Idempotency Collisions** | Picos de errores 409 `IDEMPOTENCY_IN_PROGRESS` / `IDEMPOTENCY_KEY_REUSED` | **P3 (Media)** | Inspeccionar posible ataque de repetición o micro-desconexiones que provoquen doble submit desde el cliente móvil. |
| **Anomalía de Autorización Admin** | > 5 errores HTTP 401/403 en endpoints `/api/admin/*` en 1 minuto | **P3 (Media)** | Auditoría de IPs sospechosas; evaluar bloqueo temporal en firewall perimetral de Vercel. |

---

## 6. Plan de Respuesta a Incidentes (IRP) y Matriz RACI

### 6.1 Clasificación de Severidad

* **P1 — Crítica (SLA: < 15 min):** Checkout inaccesible, fallo en cobro monetario, base de datos caída o fuga de credenciales.
* **P2 — Alta (SLA: < 1 hora):** Fallo en panel de pedidos de administración, inventario bloqueado, o error de inicio de sesión de administradores.
* **P3 — Media (SLA: < 4 horas):** Problemas visuales no bloqueantes en catálogo, demoras en exportación Excel o errores menores de UI.
* **P4 — Baja (SLA: Siguiente Sprint):** Detalles cosméticos, mejoras de contraste o ajustes de documentación.

### 6.2 Matriz RACI Operativa

| Rol en Incidente | Responsabilidad Principal | Titular Designado |
|---|---|---|
| **Líder de Incidente (Tech Lead / DevOps)** | Diagnóstico técnico, toma de decisiones de Rollback y comunicación técnica. | Responsable Técnico Principal (`Jafeth-MV`) |
| **Ingeniero de Guardia (Fullstack)** | Mitigación de código, aplicación de hotfixes y pruebas de regresión. | Equipo de Desarrollo |
| **Dueño de Pastelería (Negocio)** | Comunicación con clientes afectados, coordinación comercial de pedidos. | Gerencia General Dulce Fe |
| **Atención a Clientes** | Soporte directo vía WhatsApp ante dudas de entrega o estado de compra. | Canal Oficial de WhatsApp |

---

## 7. Procedimiento de Cierre de Incidente y Post-Mortem

Tras la resolución de cualquier incidente clasificado como P1 o P2:
1. Redactar reporte post-mortem sin culpas (*Blameless Post-Mortem*) en `docs/04 - Informes de Ejecucion/`.
2. Registrar la causa raíz (5 Porqués), impacto económico/operativo y tiempo total de restablecimiento.
3. Abrir issues preventivos y tareas de mejora técnica para evitar la repetición del incidente.
