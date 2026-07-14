# AGENTS.md — Sistema de Gestión de Estacionamientos

## 1. Setup Rápido

```bash
# Clonar y arrancar
cp .env.example .env
docker-compose up --build

# Migraciones y datos iniciales
docker-compose exec api npx sequelize-cli db:migrate
docker-compose exec api npx sequelize-cli db:seed:all
```

### Credenciales de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@parking.com` | `admin123` |
| Employee | `employee@parking.com` | `employee123` |

### Servicios

| Servicio | Puerto |
|----------|:---:|
| API (Node 18) | 3000 |
| PostgreSQL 13 | 5432 |
| PgAdmin | 5050 |

---

## 2. Arquitectura

### Flujo obligatorio

```
Request → Route → Middleware → Controller → Service → Model
```

**Prohibido:** acceso a datos (Sequelize) desde la capa Controller.

### Stack

- **Backend:** Node.js 18, Express
- **ORM:** Sequelize (PostgreSQL)
- **Vistas:** EJS (`res.render()`)
- **API:** REST JSON (`res.json()`)
- **Auth:** Passport (local + JWT) + `@hapi/boom`
- **Validación:** Joi
- **Infraestructura:** Docker (API + PostgreSQL + PgAdmin)

### Estructura de carpetas

```
src/
├── config/          # Variables de entorno y sequelize config
│   ├── config.js     #   dotenv + export config object
│   └── sequelize.js  #   Config por entorno (development/production)
├── db/
│   ├── models/       # Modelos Sequelize (MVC: Modelo)
│   │   ├── index.js   #   init + associate de todos los modelos
│   │   ├── user.model.js
│   │   ├── category.model.js
│   │   └── parking-record.model.js
│   ├── migrations/   # Migraciones (up + down)
│   └── seeders/      # Datos iniciales
├── libs/
│   └── sequelize.js  # Inicialización Sequelize + setupModels()
├── middlewares/
│   ├── auth.handler.js      # checkApiKey, checkRoles
│   ├── error.handler.js     # logErrors, boomErrorHandler, ormErrorHandler
│   └── validator.handler.js # validatorHandler (Joi)
├── controllers/     # Orquestan req/res (MVC: Controlador)
├── services/        # Lógica de negocio (3 Capas: Negocio)
├── routes/
│   └── index.js     # routerApi(app): API JSON + vistas EJS
├── schemas/         # Validaciones Joi
├── utils/auth/      # Passport strategies (local + JWT)
│   ├── index.js
│   └── strategies/
└── views/           # Archivos .ejs (MVC: Vista)
```

### Convenciones de modelos

```js
// Atributo Sequelize en camelCase, columna en snake_case
isActive: {
  type: DataTypes.BOOLEAN,
  field: 'is_active',  // columna física en PostgreSQL
}

// Tablas: snake_case, plural
const TABLE_NAME = 'parking_records';
```

---

## 3. Base de Datos

### Diagrama ER

```
users (id, email, password_hash, name, role, is_active)
  │ 1:N (registered_by)
  ▼
parking_records (id, plate, entry_time, exit_time, total_minutes, total_cost,
                 category_id, registered_by, status)
  ▲
  │ 1:N (category_id)
categories (id, name, description, price_per_minute, is_active)
```

### Esquema completo

Ver `docs/esquemaBD.md` para la especificación completa (reglas de negocio, 3NF, índices, constraints).

### Migraciones existentes

| Archivo | Tabla | Estado |
|---------|-------|:---:|
| `20240101000001-create-users.js` | usuarios (versión anterior, histórico) | Aplicada |
| `20250101000001-create-users.js` | `users` (esquema actual) | Aplicada |
| `20250101000002-create-categories.js` | `categories` | Aplicada |
| `20250101000003-create-parking-records.js` | `parking_records` + partial unique index | Aplicada |

### Seeders

| Archivo | Datos |
|---------|-------|
| `20250101000001-users.js` | 2 usuarios (admin + employee) |
| `20250101000002-categories.js` | 3 categorías (Oficial $0.00, Residente $1.00, No Residente $3.00) |
| `20250101000003-parking-records.js` | 5 registros (4 completed, 1 active) |

---

## 4. API Endpoints

### Implementados

| Método | Ruta | Seguridad | Acción |
|--------|------|-----------|--------|
| `GET` | `/api/v1` | Público | Status API |
| `POST` | `/api/v1/auth/login` | Validación Joi | Login (devuelve JWT) |
| `POST` | `/api/v1/auth/register` | Validación Joi | Registro público |
| `GET` | `/api/v1/users` | apiKey + JWT | Listar usuarios |
| `GET` | `/api/v1/users/:id` | apiKey + JWT | Ver usuario |
| `POST` | `/api/v1/users` | apiKey + JWT + admin | Crear usuario |
| `PATCH` | `/api/v1/users/:id` | apiKey + JWT + admin | Actualizar usuario |
| `DELETE` | `/api/v1/users/:id` | apiKey + JWT + admin | Eliminar usuario |
| `GET` | `/users/list` | Público | Vista EJS usuarios |
| `GET` | `/auth/login` | Público | Vista EJS login |

### Headers de seguridad

```
api: test-api-key-2024
Authorization: Bearer <token_jwt>
```

### Pendientes por implementar

| Módulo | Endpoints | Rol |
|--------|-----------|-----|
| **Categories** | CRUD (`/api/v1/categories`) | Admin (crear/editar/soft-delete), Empleado (listar) |
| **Parking Entry** | `POST /api/v1/parking/entry` | Empleado, Admin |
| **Parking Exit/Cobro** | `POST /api/v1/parking/exit` | Empleado, Admin |
| **Parking List** | `GET /api/v1/parking` (+ filtros) | Empleado, Admin |
| **Reportes** | `GET /api/v1/reports` (filtros: fecha, categoría, ingreso) | Admin |
| **Export Excel** | `GET /api/v1/reports/export` | Admin |

---

## 5. Patrones de Código

### Crear un nuevo módulo (ejemplo: categorías)

```
1. src/schemas/category.schema.js   → Validación Joi
2. src/services/category.service.js  → Lógica de negocio (acceso a Sequelize)
3. src/controllers/category.controller.js → Orquestar req/res
4. src/routes/category.routes.js     → Export { apiRouter, viewRouter }
5. src/routes/index.js               → Registrar rutas
```

### Controller de ejemplo

```js
const SomeService = require('../services/some.service');
const service = new SomeService();

class SomeController {
  async findAll(req, res, next) {
    try {
      const items = await service.find();
      res.json(items);
    } catch (error) {
      next(error);  // <-- los middlewares de error capturan esto
    }
  }
}
```

### Service de ejemplo

```js
const { models } = require('../libs/sequelize');
const boom = require('@hapi/boom');

class SomeService {
  async find() {
    return await models.SomeModel.findAll();
  }

  async findOne(id) {
    const item = await models.SomeModel.findByPk(id);
    if (!item) throw boom.notFound('item not found');
    return item;
  }
}
```

### Route de ejemplo

```js
const express = require('express');
const apiRouter = express.Router();
const viewRouter = express.Router();

// API JSON (prefijo /api/v1/mymodule)
apiRouter.get('/', /* middleware */, controller.findAll.bind(controller));

// Vistas EJS (prefijo /mymodule)
viewRouter.get('/list', controller.renderList.bind(controller));

module.exports = { apiRouter, viewRouter };
```

---

## 6. Reglas del Proyecto

### Nombrado de archivos
- **Servicios:** `<entity>.service.js`
- **Controladores:** `<entity>.controller.js`
- **Rutas:** `<entity>.routes.js`
- **Schemas (Joi):** `<entity>.schema.js`
- **Modelos:** `<entity>.model.js`
- **Migraciones:** `YYYYMMDDHHMMSS-<description>.js`
- **Seeders:** `YYYYMMDDHHMMSS-<description>.js`

### Nombrado en BD
- **Tablas:** `snake_case`, plural (`parking_records`)
- **Columnas:** `snake_case` (`created_at`, `price_per_minute`)
- **Atributos Sequelize:** `camelCase` (`createdAt`, `pricePerMinute`)

### Dependencia de capas
- **Controller** → importa Service
- **Service** → importa models (via `{ models } = require('../libs/sequelize')`)
- **Nunca:** Controller → Sequelize directo

### Errores
- Usar `@hapi/boom` para errores HTTP (`boom.notFound()`, `boom.unauthorized()`)
- Los middlewares de error (`error.handler.js`) capturan y formatean automáticamente

---

## 7. Comandos Útiles

```bash
# Migraciones
docker-compose exec api npx sequelize-cli db:migrate          # Aplicar pendientes
docker-compose exec api npx sequelize-cli db:migrate:undo     # Revertir última
docker-compose exec api npx sequelize-cli db:migrate:undo:all # Revertir todas

# Seeders
docker-compose exec api npx sequelize-cli db:seed:all         # Ejecutar todos
docker-compose exec api npx sequelize-cli db:seed:undo:all    # Revertir todos

# Generar nueva migración
docker-compose exec api npx sequelize-cli migration:generate --name <descripcion>

# PostgreSQL directo
docker-compose exec postgres psql -U garza_user -d garza_limon_db

# Logs API
docker-compose logs api --tail=50
```
