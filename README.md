# VeloPark — Sistema de Gestion de Estacionamiento

Aplicacion web para administrar el acceso, cobro y reportes de un estacionamiento. Registra entradas y salidas de vehiculos, calcula tarifas automaticamente por categoria y permite exportar reportes en Excel y PDF.

---

## Stack

| Capa | Tecnologia |
|------|------------|
| Backend | Node.js 18 + Express |
| ORM | Sequelize |
| Base de datos | PostgreSQL 13 |
| Vistas | EJS + Tailwind CSS |
| Auth | Passport (local + JWT) |
| Validacion | Joi |
| Errores | @hapi/boom |
| Infraestructura | Docker (API + PostgreSQL + PgAdmin) |

---

## Prerrequisitos

- **Docker** y **Docker Compose** instalados en la maquina
- **Git** para clonar el repositorio
- Puertos **3000**, **5432** y **5050** libres

> Si no tienes Docker, instalalo desde [docker.com](https://docs.docker.com/get-docker/). Docker Compose viene incluido con Docker Desktop; en Linux instalalo con tu gestor de paquetes.

---

## Setup — Paso a paso

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd prueba-tecnica-garza-limon
```

### 2. Crear archivo `.env`

Copia el archivo de ejemplo y dejalo como esta (ya tiene los valores correctos para Docker):

```bash
cp .env.example .env
```

El contenido de `.env` debe ser:

```env
NODE_ENV=development
PORT=3000

DB_HOST=postgres
DB_PORT=5432
DB_NAME=garza_limon_db
DB_USER=garza_user
DB_PASSWORD=garza_password

API_KEY=test-api-key-2024
JWT_SECRET=test-jwt-secret-2024

EMAIL=admin@garzalimon.com
EMAIL_PASSWORD=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

> **Importante**: `DB_HOST` se mantiene como `localhost` para Sequelize CLI (migraciones desde tu maquina). Dentro del contenedor `api` se usa `postgres` (ya configurado en `docker-compose.yml`).

### 3. Construir y levantar los contenedores

```bash
docker-compose up --build -d
```

Esto levanta 3 servicios:
- **api** — Node 18 con Express + Nodemon (hot reload), puerto **3000**
- **postgres** — PostgreSQL 13, puerto **5432**
- **pgadmin** — PgAdmin 4 (UI para explorar la BD), puerto **5050**

Verifica que los 3 esten corriendo:

```bash
docker-compose ps
```

### 4. Ejecutar migraciones

```bash
docker-compose exec api npx sequelize-cli db:migrate
```

Esto crea las tablas en PostgreSQL.

### 5. Ejecutar seeders (datos iniciales)

```bash
docker-compose exec api npx sequelize-cli db:seed:all
```

Esto inserta usuarios, categorias y registros de prueba.

### 6. Verificar que funcione

Abre tu navegador en:

- **Aplicacion**: http://localhost:3000/auth/login
- **PgAdmin**: http://localhost:5050 (email: `admin@garzalimon.com`, password: `admin123`)

---

## Migraciones

Se ejecutan en este orden. Cada una crea una tabla con sus indices y constraints.

| # | Archivo | Tabla | Que crea |
|---|---------|-------|----------|
| 1 | `20250101000001-create-users.js` | `users` | Tabla de usuarios con columnas `id`, `email` (unique), `password_hash`, `name`, `role` (con CHECK `admin`/`employee`), `is_active`, timestamps. Indice unique sobre `email`. |
| 2 | `20250101000002-create-categories.js` | `categories` | Tabla de categorias tarifarias con `id`, `name` (unique), `description`, `price_per_minute` (decimal), `is_active`, timestamps. Indice unique sobre `name`. |
| 3 | `20250101000003-create-vehicles.js` | `vehicles` | Tabla de vehiculos registrados con `id`, `plate` (unique FK desde parking_records), `category_id` (FK -> categories), `is_active`, timestamps. Indices unique sobre `plate` y btree sobre `category_id`. |
| 4 | `20250101000004-create-parking-records.js` | `parking_records` | Tabla de registros de estacionamiento con `plate` (FK -> vehicles.plate), `entry_time`, `exit_time`, `total_minutes`, `total_cost`, `category_id` (FK -> categories), `registered_by` (FK -> users), `status` (CHECK `active`/`completed`). Partial unique index sobre `plate WHERE status = 'active'`. Indices sobre `entry_time`, `category_id`, `status`. |

### Revertir migraciones

```bash
# Revertir la ultima migracion
docker-compose exec api npx sequelize-cli db:migrate:undo

# Revertir todas las migraciones
docker-compose exec api npx sequelize-cli db:migrate:undo:all
```

---

## Seeds — Datos iniciales

### Usuarios

| # | Email | Password | Rol | Nombre |
|---|-------|----------|-----|--------|
| 1 | `admin@parking.com` | `admin123` | **Admin** | Administrador |
| 2 | `employee@parking.com` | `employee123` | **Employee** | Empleado |

### Categorias tarifarias

| # | Nombre | Precio/min | Descripcion |
|---|--------|:----------:|-------------|
| 1 | Oficial | $0.00 | Vehiculos oficiales — No pagan |
| 2 | Residente | $1.00 | Residentes del estacionamiento |
| 3 | No Residente | $3.00 | Visitantes sin residencia |

### Registros de estacionamiento (5)

- 4 registros completados (con entrada, salida y costo calculado)
- 1 registro activo (vehiculo actualmente estacionado: `JKL012`)

### Vehiculos registrados (5)

| Placa | Categoria |
|-------|-----------|
| ABC123 | Residente |
| DEF456 | No Residente |
| GHI789 | Oficial |
| JKL012 | No Residente |
| MNO345 | Residente |

Los registros usan tiempos relativos al momento en que se ejecuta el seeder, por lo que las fechas y tiempos seran coherentes.

### Revertir seeders

```bash
docker-compose exec api npx sequelize-cli db:seed:undo:all
```

---

## Servicios

| Servicio | URL | Descripcion |
|----------|-----|-------------|
| **Aplicacion** | http://localhost:3000 | Login, Dashboard, Reportes, Categorias, Usuarios |
| **API REST** | http://localhost:3000/api/v1 | Endpoints JSON protegidos con JWT |
| **PostgreSQL** | `localhost:5432` | Base de datos (user: `garza_user`, db: `garza_limon_db`) |
| **PgAdmin** | http://localhost:5050 | UI para explorar PostgreSQL (email: `admin@garzalimon.com`, pass: `admin123`) |

### Conectarse a la base de datos desde PgAdmin

1. Abre http://localhost:5050 en tu navegador
2. Inicia sesion con:
   - **Email**: `admin@garzalimon.com`
   - **Password**: `admin123`
3. Agrega el servidor PostgreSQL:
   - Click derecho en **Servers** -> **Register** -> **Server**
   - Pestana **General** -> Name: `Garza Limon DB`
   - Pestana **Connection**:
     - **Host name/address**: `postgres` (nombre del servicio en Docker, NO `localhost`)
     - **Port**: `5432`
     - **Maintenance database**: `garza_limon_db`
     - **Username**: `garza_user`
     - **Password**: `garza_password`
   - Click **Save**
4. Expande Servers -> Garza Limon DB -> Databases -> garza_limon_db -> Schemas -> public -> Tables

> **Por que `postgres` y no `localhost`?** PgAdmin esta dentro de la red de Docker. El servicio de PostgreSQL se llama `postgres` en `docker-compose.yml`. Si pones `localhost`, PgAdmin buscara en su propio contenedor, no en el de PostgreSQL.

---

## Guia rapida de uso

### Login

1. Abre http://localhost:3000/auth/login
2. Ingresa con una de las credenciales de prueba

### Roles

| Rol | Acceso |
|-----|--------|
| **Admin** | Dashboard, Reportes (filtros + export Excel/PDF), Categorias (CRUD), Usuarios (lista) |
| **Employee** | Dashboard: registrar entrada y cobrar salida unicamente |

### Flujo principal

1. **Registrar entrada** — Selecciona placa + categoria -> click Registrar
2. **Cobrar salida** — En la tabla de vehiculos estacionados, click Cobrar -> Confirmar
3. El sistema calcula automaticamente minutos transcurridos x tarifa de la categoria

### Reportes (solo Admin)

- Filtros por fecha, placa, categoria, rango de costo, rango de minutos
- Exportacion a **Excel** y **PDF** (general y por placa)

### Categorias (solo Admin)

- Crear, editar y desactivar categorias tarifarias
- Soft-delete: la categoria se desactiva pero se conserva en la BD

---

## Comandos utiles

```bash
# Ver logs de la API
docker-compose logs api --tail=50

# Seguir logs en tiempo real
docker-compose logs -f api

# Conectarse a PostgreSQL directamente
docker-compose exec postgres psql -U garza_user -d garza_limon_db

# Reiniciar la API (Nodemon detecta cambios automaticamente)
docker-compose restart api

# Detener todo
docker-compose down

# Detener todo Y eliminar volumenes (BD incluida)
docker-compose down -v
```

---

## Arquitectura

```
Request -> Route -> Middleware -> Controller -> Service -> Model (Sequelize)
```

**Regla**: El Controller nunca accede directamente a Sequelize. Toda la logica de negocio y acceso a datos va en la capa Service.

## Estructura de carpetas

```
src/
  config/          # Variables de entorno y config Sequelize
  db/
    models/        # Modelos Sequelize
    migrations/    # Migraciones (creacion de tablas)
    seeders/       # Datos iniciales de prueba
  controllers/     # Orquestan req/res
  services/        # Logica de negocio
  routes/          # Definicion de rutas API + vistas
  schemas/         # Validaciones Joi
  middlewares/     # Auth (JWT, roles), errores, validacion
  utils/auth/      # Estrategias Passport (local + JWT)
  views/           # Vistas EJS con Tailwind CSS
    auth/          # Login
    parking/       # Dashboard + Reportes
    categories/    # CRUD Categorias
    vehicles/      # CRUD Vehiculos
    users/         # Lista de Usuarios
```

---

## Diagrama de Base de Datos

```
+------------------+     +---------------------+     +------------------+
|     users        |     |    categories       |     |    vehicles      |
+------------------+     +---------------------+     +------------------+
| id (PK)          |     | id (PK)             |     | id (PK)          |
| email (UNIQUE)   |     | name (UNIQUE)       |     | plate (UNIQUE)   |
| password_hash    |     | description         |     | category_id (FK)-+
| name             |     | price_per_minute    |     | is_active        |
| role             |     | is_active           |     | created_at       |
| is_active        |     | created_at          |     | updated_at       |
| created_at       |     | updated_at          |     +--------+---------+
| updated_at       |     +----------+----------+              |
+--------+---------+                |                         |
         |                          | 1:N                     | 1:N
         | 1:N                      |                         |
         |                          |                         |
+--------v--------------------------v-------------------------v----------+
|                        parking_records                                 |
+------------------------------------------------------------------------+
| id (PK)                                                                |
| plate (FK -> vehicles.plate, NOT NULL)                                 |
| category_id (FK -> categories.id, NOT NULL)                            |
| registered_by (FK -> users.id, NOT NULL)                               |
| entry_time (NOT NULL, DEFAULT NOW())                                   |
| exit_time (NULL)                                                       |
| total_minutes (NULL, calculado al salir)                               |
| total_cost (NULL, calculado al salir)                                  |
| status (CHECK: 'active' | 'completed')                                |
| created_at, updated_at                                                  |
+------------------------------------------------------------------------+

Indice unico parcial:
  idx_parking_active_plate UNIQUE (plate) WHERE status = 'active'
```

### Relaciones

| FK (origen) | Referencia (destino) | ON DELETE | ON UPDATE |
|-------------|---------------------|-----------|-----------|
| `vehicles.category_id` | `categories.id` | RESTRICT | CASCADE |
| `parking_records.plate` | `vehicles.plate` | RESTRICT | RESTRICT |
| `parking_records.category_id` | `categories.id` | RESTRICT | CASCADE |
| `parking_records.registered_by` | `users.id` | RESTRICT | CASCADE |