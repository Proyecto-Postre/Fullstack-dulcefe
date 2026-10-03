---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/dashboard/at-risk-products
autenticacion: true
rol_requerido: ADMIN
modulo: dashboard-vitrina
fase: 7
---

# ⚡ `GET` /api/admin/dashboard/at-risk-products

## 🎯 Propósito
Calcula en tiempo real para todos los postres activos en catálogo cuál es el **cuello de botella** de materia prima según sus recetas y tandas asociadas, determinando el **stock virtual máximo que se puede hornear o armar**.
Permite a la pastelería identificar qué productos están en riesgo crítico o bajo stock de materia prima antes de abrir la tienda.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "critical_products": [
      {
        "product_id": 3,
        "product_name": "Caja Alfajores Clásicos x12",
        "current_stock": 2,
        "max_producible": 4,
        "limiting_material": {
          "id": 12,
          "name": "Manjar Blanco de Olla",
          "current_stock": 500,
          "required_per_unit": 120,
          "unit": "g"
        },
        "risk_level": "critical"
      }
    ],
    "warning_products": [],
    "healthy_products_count": 18
  }
}
```
