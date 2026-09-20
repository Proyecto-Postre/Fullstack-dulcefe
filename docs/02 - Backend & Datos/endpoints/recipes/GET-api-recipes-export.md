---
tipo: api-endpoint
metodo: GET
ruta: /api/recipes/export
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `GET` /api/recipes/export

## 🎯 Propósito
Genera en streaming un libro de cálculo Microsoft Excel (`.xlsx`) con **fórmulas vivas nativas de Excel** para todas las recetas, costos CIF y márgenes según [[ADR-004-motor-escandallos-exportacion-exceljs]].

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Headers:** `Authorization: Bearer <TOKEN>`

## 📤 Response
### ✅ `200 OK` (Binary Stream)
* **Headers:**
  * `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  * `Content-Disposition: attachment; filename="Escandallos_DulceFe.xlsx"`
* **Body:** Archivo binario `.xlsx` con hojas de insumos, fórmulas dinámicas y matriz de rentabilidad.

## ❌ Manejo de Errores Comunes
* `500 Internal Server Error`: Fallo al compilar el workbook con ExcelJS.
