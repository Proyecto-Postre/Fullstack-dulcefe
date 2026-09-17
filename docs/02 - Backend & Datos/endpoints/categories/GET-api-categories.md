---
tipo: api-endpoint
metodo: GET
ruta: /api/categories
autenticacion: false
rol_requerido: PUBLIC
estado: produccion
---

# ⚡ `GET` /api/categories

## 🎯 Propósito
Retorna el listado de categorías activas para el catálogo de postres de Dulce Fe. Permite dinamizar los filtros y pestañas de categorías en la vitrina pública. Si la tabla está vacía en base de datos, el catálogo oculta limpiamente los filtros sin romper la interfaz.

## 🔐 Requisitos de Seguridad
* **Auth:** Pública (cualquier visitante puede leer las categorías activas).
* **RLS:** Controlado por la política `"Public read active categories"` en `public.categories`.

## 📥 Request
No requiere parámetros ni cuerpo.

```http
GET /api/categories HTTP/1.1
Host: dulcefe.pe
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "tortas-clasicas",
      "name": "Tortas Clásicas",
      "icon": "lucide:cake",
      "sort_order": 1
    },
    {
      "id": "postres-individuales",
      "name": "Postres Individuales",
      "icon": "lucide:cupcake",
      "sort_order": 2
    },
    {
      "id": "antojos-salados",
      "name": "Antojos Salados",
      "icon": "lucide:croissant",
      "sort_order": 3
    }
  ]
}
```
