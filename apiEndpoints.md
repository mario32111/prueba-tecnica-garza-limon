# API Endpoints — VeloPark

Documentacion completa de todos los endpoints de la aplicacion. Incluye API REST (JSON) y vistas (EJS).

---

## Configuracion

```bash
BASE_URL="http://localhost:3000"
API_KEY="test-api-key-2024"
```

### Headers comunes

| Header | Valor | Endpoints que lo requieren |
|--------|-------|---------------------------|
| `api` | `test-api-key-2024` | Todos los endpoints de API |
| `Authorization` | `Bearer <token_jwt>` | Todos los endpoints protegidos |
| `Content-Type` | `application/json` | POST, PATCH (con body) |

### Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total a todos los endpoints |
| `employee` | Lectura de vehiculos, usuarios, categorias. Escritura de parking (entrada/salida). Sin acceso a reportes/export. |

---

## 1. Auth

### 1.1 Status API

```
GET /api/v1
```

| Auth | Headers | Body | Response |
|------|---------|------|----------|
| — | — | — | `200` → `{"message":"API v1 running","version":"1.0.0"}` |

```bash
curl -s http://localhost:3000/api/v1 | python3 -m json.tool
```

### 1.2 Login (API — obtiene JWT)

```
POST /api/v1/auth/login
```

| Auth | Headers | Body | Response |
|------|---------|------|----------|
| — | `api` | `{"email":"admin@parking.com","password":"admin123"}` | `200` → `{"user":{...},"token":"eyJ..."}` |

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -d '{"email":"admin@parking.com","password":"admin123"}' | python3 -m json.tool

# Guardar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -d '{"email":"admin@parking.com","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
```

**Errores:**
- `400` → Validacion Joi: falta email o password
- `401` → Credenciales invalidas

### 1.3 Registro (API)

```
POST /api/v1/auth/register
```

| Auth | Headers | Body | Response |
|------|---------|------|----------|
| — | `api` | `{"email":"nuevo@test.com","password":"123456"}` | `201` → `{"id":...,"email":"...","role":"employee"}` |

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -d '{"email":"nuevo@test.com","password":"123456"}'
```

**Errores:**
- `400` → Validacion Joi
- `409` → Email ya registrado

### 1.4 Login (Vista EJS)

```
GET /auth/login
```

| Auth | Response |
|------|----------|
| — | `200` → HTML con formulario de login y logo VeloPark |

```
POST /auth/login
```

| Body | Response |
|------|----------|
| `{"email":"admin@parking.com","password":"admin123"}` | `302` → Redirect a `/dashboard`. Cookie `token` (httpOnly) |

### 1.5 Logout (Vista)

```
GET /auth/logout
```

| Auth | Response |
|------|----------|
| Cookie `token` | `302` → Redirect a `/auth/login`. Cookie `token` eliminada |

---

## 2. Users

### 2.1 Listar usuarios

```
GET /api/v1/users
```

| Auth | Headers | Response |
|------|---------|----------|
| JWT | `api`, `Authorization: Bearer <token>` | `200` → Array de usuarios (sin campo `password`) |

```bash
TOKEN="<jwt_token>"
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/users | python3 -m json.tool
```

### 2.2 Ver usuario por ID

```
GET /api/v1/users/:id
```

| Auth | Headers | Response |
|------|---------|----------|
| JWT | `api`, `Authorization` | `200` → Objeto usuario |

```bash
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/users/1 | python3 -m json.tool
```

### 2.3 Crear usuario (admin)

```
POST /api/v1/users
```

| Auth | Headers | Body | Response |
|------|---------|------|----------|
| JWT + admin | `api`, `Authorization`, `Content-Type` | `{"email":"...","password":"...","role":"admin"}` | `201` |

```bash
curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"email":"nuevo@parking.com","password":"123456","role":"admin"}'
```

**Errores:**
- `401` → Employee intenta crear usuario
- `400` → Validacion Joi

### 2.4 Actualizar usuario (admin)

```
PATCH /api/v1/users/:id
```

```bash
curl -s -X PATCH http://localhost:3000/api/v1/users/1 \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"role":"employee"}'
```

### 2.5 Eliminar usuario (admin)

```
DELETE /api/v1/users/:id
```

```bash
curl -s -X DELETE \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  http://localhost:3000/api/v1/users/1
```

### 2.6 Vista de usuarios (admin)

```
GET /users/list
```

| Auth | Response |
|------|----------|
| Cookie `token` + admin | `200` → HTML con tabla de usuarios |

---

## 3. Categories

### 3.1 Listar categorias

```
GET /api/v1/categories
```

| Auth | Headers | Response |
|------|---------|----------|
| JWT | `api`, `Authorization` | `200` → Array de categorias (solo activas) |

```bash
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/categories | python3 -m json.tool
```

### 3.2 Ver categoria por ID

```
GET /api/v1/categories/:id
```

```bash
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/categories/1 | python3 -m json.tool
```

### 3.3 Crear categoria (admin)

```
POST /api/v1/categories
```

| Auth | Body | Response |
|------|------|----------|
| JWT + admin | `{"name":"VIP","pricePerMinute":0.50,"description":"..."}` (description opcional) | `201` |

```bash
curl -s -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"name":"VIP","pricePerMinute":0.50,"description":"Clientes especiales"}'
```

### 3.4 Actualizar categoria (admin)

```
PATCH /api/v1/categories/:id
```

```bash
curl -s -X PATCH http://localhost:3000/api/v1/categories/1 \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"name":"Oficial Editada","pricePerMinute":0.25}'
```

### 3.5 Desactivar categoria — Soft Delete (admin)

```
DELETE /api/v1/categories/:id
```

| Nota | Response |
|------|----------|
| Soft delete: `isActive = false`. FK RESTRICT impide DELETE fisico. | `200` → `{"id":...,"isActive":false}` |

```bash
curl -s -X DELETE \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  http://localhost:3000/api/v1/categories/4
```

### 3.6 Vista de categorias (admin)

```
GET /categories/list
```

| Auth | Response |
|------|----------|
| Cookie + admin | `200` → HTML con formulario de creacion + tabla de categorias |

---

## 4. Vehicles

### 4.1 Listar vehiculos

```
GET /api/v1/vehicles
```

| Auth | Headers | Response |
|------|---------|----------|
| JWT (admin/employee) | `api`, `Authorization` | `200` → Array con `plate`, `category`, `isActive` |

```bash
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/vehicles | python3 -m json.tool
```

**Nota:** La vista `/vehicles/list` muestra TODOS los vehiculos (activos e inactivos). El dashboard solo muestra vehiculos activos en el datalist.

### 4.2 Ver vehiculo por ID

```
GET /api/v1/vehicles/:id
```

```bash
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/vehicles/1 | python3 -m json.tool
```

### 4.3 Crear vehiculo (admin)

```
POST /api/v1/vehicles
```

| Auth | Body | Response |
|------|------|----------|
| JWT + admin | `{"plate":"ABC123","categoryId":2}` | `201` → `{"id":...,"plate":"ABC123","isActive":true}` |

```bash
curl -s -X POST http://localhost:3000/api/v1/vehicles \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"plate":"NUEVO01","categoryId":2}'
```

**Errores:**
- `401` → Employee intenta crear
- `409` → Placa ya registrada
- `400` → Validacion Joi

### 4.4 Actualizar categoria de vehiculo (admin)

```
PATCH /api/v1/vehicles/:id
```

| Nota | Body | Response |
|------|------|----------|
| Solo se puede cambiar la categoria. La placa NO se puede modificar (FK RESTRICT). | `{"categoryId":3}` | `200` |

```bash
curl -s -X PATCH http://localhost:3000/api/v1/vehicles/1 \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{"categoryId":3}'
```

### 4.5 Desactivar vehiculo — Soft Delete (admin)

```
DELETE /api/v1/vehicles/:id
```

| Comportamiento | Response |
|----------------|----------|
| Soft delete: `isActive = false`. El vehiculo sigue en la lista pero no puede registrar entradas/salidas. FK RESTRICT impide DELETE fisico si tiene historial. | `200` → `{"id":...,"isActive":false}` |

```bash
curl -s -X DELETE \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  http://localhost:3000/api/v1/vehicles/1
```

### 4.6 Reactivar vehiculo (admin)

```
PATCH /api/v1/vehicles/:id/reactivate
```

| Response |
|----------|
| `200` → `{"id":...,"isActive":true}` |

```bash
curl -s -X PATCH \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  http://localhost:3000/api/v1/vehicles/1/reactivate
```

### 4.7 Vista de vehiculos

```
GET /vehicles/list
```

| Auth | Admin | Employee |
|------|:----:|:--------:|
| Cookie | `200` → Tabla + formulario crear/editar + botones admin | `200` → Solo tabla (sin formulario ni botones) |

---

## 5. Parking

### 5.1 Listar todos los registros (con filtros)

```
GET /api/v1/parking
```

| Query Params (todos opcionales) | Descripcion |
|--------------------------------|-------------|
| `plate` | Filtrar por placa (LIKE %value%) |
| `dateFrom` | Fecha inicio (ISO: 2026-07-13). Incluye desde 00:00:00 |
| `dateTo` | Fecha fin (ISO: 2026-07-14). Incluye hasta 23:59:59 |
| `categoryId` | Filtrar por categoria |
| `minCost` | Costo minimo |
| `maxCost` | Costo maximo |
| `minMinutes` | Minutos minimos |
| `maxMinutes` | Minutos maximos |
| `sortBy` | Ordenar por: `plate`, `entry_time`, `exit_time`, `total_cost`, `total_minutes` |
| `sortOrder` | `ASC` o `DESC` |

```bash
# Sin filtros
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/parking | python3 -m json.tool

# Con filtros
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/parking?dateFrom=2026-07-13&dateTo=2026-07-14&categoryId=2&sortBy=total_cost&sortOrder=DESC" | python3 -m json.tool
```

**Response:** Cada registro incluye `category` (objeto anidado), `registeredByUser` (nombre), y `vehicle` (objeto anidado con categoria del vehiculo).

### 5.2 Vehiculos activos (estacionados)

```
GET /api/v1/parking/active
```

```bash
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/parking/active | python3 -m json.tool
```

### 5.3 Buscar historial por placa

```
GET /api/v1/parking/plate/:plate
```

```bash
curl -s -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/parking/plate/ABC123 | python3 -m json.tool
```

**Errores:**
- `404` → No hay registros para esa placa

### 5.4 Registrar entrada

```
POST /api/v1/parking/entry
```

| Auth | Body | Comportamiento |
|------|------|----------------|
| JWT (admin/employee) | `{"plate":"ABC123","categoryId":2}` | Si la placa no existe en `vehicles`, se crea automaticamente |

| Response |
|----------|
| `201` → `{"plate":"ABC123","category":{"name":"..."},"registeredByUser":{"name":"..."},"status":"active"}` |

```bash
curl -s -X POST http://localhost:3000/api/v1/parking/entry \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plate":"ABC123","categoryId":2}'
```

**Errores:**
- `409` → Placa ya tiene estancia activa
- `409` → Vehiculo desactivado en el sistema
- `400` → Validacion Joi (falta placa o categoria)

### 5.5 Registrar salida (cobrar)

```
POST /api/v1/parking/exit
```

| Auth | Body | Response |
|------|------|----------|
| JWT (admin/employee) | `{"plate":"ABC123"}` | `200` → `{"plate":"...","totalMinutes":...,"totalCost":...,"status":"completed"}` |

```bash
curl -s -X POST http://localhost:3000/api/v1/parking/exit \
  -H "Content-Type: application/json" \
  -H "api: test-api-key-2024" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"plate":"ABC123"}'
```

**Calculo:** `totalCost = totalMinutes × pricePerMinute` (minutos redondeados hacia arriba)

**Errores:**
- `404` → No hay estancia activa para esta placa
- `409` → Vehiculo desactivado

---

## 6. Export

### 6.1 Exportar Excel (general)

```
GET /api/v1/parking/export
```

| Auth | Headers | Query | Response |
|------|---------|-------|----------|
| JWT + admin | `api`, `token` en query (no en header) | Mismos filtros que `GET /parking` | `200` → Archivo `.xlsx` |

```bash
# Sin filtros
curl -s -o reporte.xlsx \
  "http://localhost:3000/api/v1/parking/export?api=test-api-key-2024&token=$TOKEN_ADMIN"

# Con filtros
curl -s -o reporte_filtrado.xlsx \
  "http://localhost:3000/api/v1/parking/export?dateFrom=2026-07-13&dateTo=2026-07-14&api=test-api-key-2024&token=$TOKEN_ADMIN"
```

> **Nota:** El token se pasa como query param `?token=...` en lugar de header porque los exports se abren via `window.open()` en el navegador y no se pueden setear headers.

### 6.2 Exportar Excel por placa

```
GET /api/v1/parking/export/:plate
```

```bash
curl -s -o reporte_ABC123.xlsx \
  "http://localhost:3000/api/v1/parking/export/ABC123?api=test-api-key-2024&token=$TOKEN_ADMIN"
```

### 6.3 Exportar PDF (general)

```
GET /api/v1/parking/export-pdf
```

| Formato | Orientacion | Contenido |
|---------|:----------:|-----------|
| PDF (letter) | Landscape | Titulo + fecha + tabla de 8 columnas (Placa, Categoria, Entrada, Salida, Min, Costo, Estado, Registrado) |

```bash
curl -s -o reporte.pdf \
  "http://localhost:3000/api/v1/parking/export-pdf?api=test-api-key-2024&token=$TOKEN_ADMIN"
```

### 6.4 Exportar PDF por placa

```
GET /api/v1/parking/export-pdf/:plate
```

```bash
curl -s -o reporte_ABC123.pdf \
  "http://localhost:3000/api/v1/parking/export-pdf/ABC123?api=test-api-key-2024&token=$TOKEN_ADMIN"
```

**Errores (todos los exports):**
- `401` → Employee intenta exportar

---

## 7. Vistas (EJS)

| Ruta | Auth | Admin | Employee | Descripcion |
|------|------|:-----:|:--------:|-------------|
| `/auth/login` | — | ✅ | ✅ | Login con Tailwind + logo VeloPark |
| `/dashboard` | Cookie | ✅ | ✅ | Panel: registrar entrada, buscar, vehiculos activos, cobrar |
| `/parking/reports` | Cookie + admin | ✅ | ❌ 401 | Reportes con filtros + export Excel/PDF |
| `/categories/list` | Cookie + admin | ✅ | ❌ 401 | CRUD de categorias tarifarias |
| `/vehicles/list` | Cookie | ✅ | ✅ (solo lectura) | Gestion de vehiculos (admin: CRUD, employee: tabla) |
| `/users/list` | Cookie + admin | ✅ | ❌ 401 | Lista de usuarios del sistema |

### Vista Dashboard

El dashboard incluye:
- Formulario de entrada con autocompletado de vehiculos registrados (`<datalist>`)
- La placa se auto-completa con la categoria del vehiculo si existe
- Placas nuevas se crean automaticamente en `vehicles` al registrar entrada
- Buscador de historial por placa (mismo campo de entrada)
- Tabla de vehiculos estacionados con timer en tiempo real
- Modal de confirmacion de cobro con animacion

### Vista Vehiculos

- Admin: formulario de creacion, panel de edicion, botones Editar/Desactivar/Reactivar
- Employee: solo tabla de vehiculos con estado (sin formularios ni botones de accion)
- Vehiculos inactivos se muestran con badge rojo "Inactivo"
- Vehiculos activos se muestran con badge verde "Activo"

---

## 8. Tabla Resumen

| # | Metodo | Endpoint | Auth | Roles | Descripcion |
|---|:------:|----------|------|-------|-------------|
| 1 | GET | `/api/v1` | — | — | Status API |
| 2 | POST | `/api/v1/auth/login` | — | — | Login (JWT) |
| 3 | POST | `/api/v1/auth/register` | — | — | Registro publico |
| 4 | GET | `/api/v1/users` | JWT | ambos | Listar usuarios |
| 5 | GET | `/api/v1/users/:id` | JWT | ambos | Ver usuario |
| 6 | POST | `/api/v1/users` | JWT | admin | Crear usuario |
| 7 | PATCH | `/api/v1/users/:id` | JWT | admin | Actualizar usuario |
| 8 | DELETE | `/api/v1/users/:id` | JWT | admin | Eliminar usuario |
| 9 | GET | `/api/v1/categories` | JWT | ambos | Listar categorias |
| 10 | GET | `/api/v1/categories/:id` | JWT | ambos | Ver categoria |
| 11 | POST | `/api/v1/categories` | JWT | admin | Crear categoria |
| 12 | PATCH | `/api/v1/categories/:id` | JWT | admin | Actualizar categoria |
| 13 | DELETE | `/api/v1/categories/:id` | JWT | admin | Desactivar (soft delete) |
| 14 | GET | `/api/v1/vehicles` | JWT | ambos | Listar vehiculos |
| 15 | GET | `/api/v1/vehicles/:id` | JWT | ambos | Ver vehiculo |
| 16 | POST | `/api/v1/vehicles` | JWT | admin | Crear vehiculo |
| 17 | PATCH | `/api/v1/vehicles/:id` | JWT | admin | Actualizar categoria |
| 18 | DELETE | `/api/v1/vehicles/:id` | JWT | admin | Desactivar (soft delete) |
| 19 | PATCH | `/api/v1/vehicles/:id/reactivate` | JWT | admin | Reactivar vehiculo |
| 20 | GET | `/api/v1/parking` | JWT | ambos | Listar registros (+ filtros) |
| 21 | GET | `/api/v1/parking/active` | JWT | ambos | Vehiculos activos |
| 22 | GET | `/api/v1/parking/plate/:plate` | JWT | ambos | Buscar por placa |
| 23 | POST | `/api/v1/parking/entry` | JWT | admin/employee | Registrar entrada |
| 24 | POST | `/api/v1/parking/exit` | JWT | admin/employee | Registrar salida (cobro) |
| 25 | GET | `/api/v1/parking/export` | JWT (query) | admin | Export Excel general |
| 26 | GET | `/api/v1/parking/export/:plate` | JWT (query) | admin | Export Excel por placa |
| 27 | GET | `/api/v1/parking/export-pdf` | JWT (query) | admin | Export PDF general |
| 28 | GET | `/api/v1/parking/export-pdf/:plate` | JWT (query) | admin | Export PDF por placa |
| 29 | GET | `/auth/login` | — | — | Vista login |
| 30 | POST | `/auth/login` | — | — | Login vista (cookie + redirect) |
| 31 | GET | `/auth/logout` | Cookie | ambos | Cerrar sesion |
| 32 | GET | `/dashboard` | Cookie | ambos | Panel principal |
| 33 | GET | `/parking/reports` | Cookie | admin | Vista de reportes |
| 34 | GET | `/categories/list` | Cookie | admin | Vista de categorias |
| 35 | GET | `/vehicles/list` | Cookie | ambos | Vista de vehiculos |
| 36 | GET | `/users/list` | Cookie | admin | Vista de usuarios |

---

## 9. Credenciales de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@parking.com` | `admin123` |
| Employee | `employee@parking.com` | `employee123` |

---

## 10. Datos Semilla

### Categorias

| ID | Nombre | Precio/min |
|:--:|--------|:----------:|
| 1 | Oficial | $0.00 |
| 2 | Residente | $1.00 |
| 3 | No Residente | $3.00 |

### Vehiculos

| Placa | Categoria |
|-------|-----------|
| ABC123 | Residente |
| DEF456 | No Residente |
| GHI789 | Oficial |
| JKL012 | No Residente |
| MNO345 | Residente |

### Parking records

5 registros de estacionamiento (4 completados + 1 activo: `JKL012`)
