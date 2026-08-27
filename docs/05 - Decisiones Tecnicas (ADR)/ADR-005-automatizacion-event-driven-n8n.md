---
tipo: adr
numero: 005
titulo: Orquestación y Automatizaciones con n8n Open-Source vs Zapier/Make
fecha: 2026-08-26
estado: aceptado
relacionado:
  - "[[plan-maestro]]"
  - "[[logica-negocio-pedidos]]"
---

# 🏛️ ADR-005: Automatizaciones con n8n Self-Hosted vs Plataformas SaaS de Pago

## 1. Contexto & Problema
El sistema requiere enviar notificaciones automáticas por WhatsApp (confirmación de compra, estado en cocina, tracking de delivery) y alertas de stock crítico al administrador. Usar Zapier o Make implicaba costos mensuales recurrentes elevados por volumen de ejecuciones.

## 2. Decisión Tomada
Adoptar **n8n (Self-Hosted / Open-Source)** conectado mediante Database Webhooks de Supabase y endpoints de Nitro.

## 3. Consecuencias
* **Impacto:** 0 costo mensual por volumen de mensajes, control total de la privacidad de los datos de los clientes y workflows visuales fácilmente modificables.
