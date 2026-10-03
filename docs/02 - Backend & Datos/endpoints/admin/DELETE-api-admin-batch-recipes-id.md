---
tipo: api-endpoint
metodo: DELETE
ruta: /api/admin/batch-recipes/:id
autenticacion: true
rol_requerido: ADMIN
modulo: tandas-maestras
fase: 7
---

# ⚡ `DELETE` /api/admin/batch-recipes/:id

## 🎯 Propósito
Elimina una tanda maestra de taller. Si existen productos vinculados a sus rendimientos mediante `product_recipe_mappings`, la eliminación aplica en cascada controlada sobre las tablas hijas.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`
* **Auditoría:** Registra `batch_recipe.delete` en `audit_events`.

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "message": "Tanda maestra eliminada exitosamente"
}
```
