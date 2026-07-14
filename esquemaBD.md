# Esquema de Base de Datos — Sistema de Gestión de Estacionamientos

## 1. Metadatos

| Propiedad | Valor |
|-----------|-------|
| Motor | PostgreSQL 13+ |
| Normalización | 3NF (Tercera Forma Normal) |
| Soft Delete | `categories.is_active`, `users.is_active`, `vehicles.is_active` |
| Versión | 2.0.0 |
| Charset | UTF-8 |

---

## 2. Reglas de Negocio

| # | Regla |
|---|-------|
| 1 | No puede haber dos registros de estacionamiento activos con la misma placa simultáneamente (restricción parcial a nivel BD). |
| 2 | Los nombres de categoría deben ser únicos (UNIQUE en `categories.name`). |
| 3 | El costo total se calcula exclusivamente como: `total_cost = total_minutes × price_per_minute` al registrar la salida. |
| 4 | `entry_time` se asigna automáticamente al crear el registro (DEFAULT NOW()). No es ingresada manualmente. |
| 5 | No se puede eliminar físicamente una categoría si tiene registros de estacionamiento asociados (protegido por FK RESTRICT). Se usa soft delete (`is_active = false`). |
| 6 | Vehículos Oficiales: la semilla establece `price_per_minute = 0.00`. El admin puede editar tarifas. |
| 7 | Solo usuarios con rol `admin` pueden crear, editar y eliminar categorías. |
| 8 | Solo usuarios con rol `admin` pueden ver reportes y exportar a Excel. |
| 9 | Los usuarios con rol `employee` tienen acceso restringido a registro de entrada/salida y consulta de vehiculos. |
| 10 | Los vehiculos deben estar registrados en la tabla `vehicles` con una placa unica. La placa en `parking_records` es FK a `vehicles.plate`. |
| 11 | Si un vehiculo no existe en `vehicles` al registrar una entrada, se crea automaticamente con la categoria seleccionada. |
| 12 | Un vehiculo desactivado (`is_active = false`) no puede registrar entradas ni salidas. Solo el admin puede reactivarlo. |
| 13 | Los vehiculos pueden verse desde ambos roles (admin y employee), pero solo admin puede crear, editar y desactivar. |

---

## 3. Diagrama Entidad-Relación

```
+------------------+          +---------------------+          +------------------+
|     users        |          |    categories       |          |    vehicles      |
+------------------+          +---------------------+          +------------------+
| id (PK)          |          | id (PK)             |          | id (PK)          |
| email (UNIQUE)   |          | name (UNIQUE)       |          | plate (UNIQUE)   |
| password_hash    |          | description         |          | category_id (FK)─┐
| name             |          | price_per_minute    |          | is_active        │
| role             |          | is_active           |          | created_at       │
| is_active        |          | created_at          |          | updated_at       │
| created_at       |          | updated_at          |          +--------+---------+│
| updated_at       |          +----------+----------+                   │         │
+--------+---------+                     │                              │ 1:N     │
         │                               │ 1:N                          │         │
         │ 1:N                           │                              │         │
         │                               │                       ┌──────┘         │
         │                               │                       │ 1:N            │
         │                               │                       │                │
+--------v-------------------------------v-----------------------v----------------v----------+
|                              parking_records                                                |
+-------------------------------------------------------------------------------------------+
| id (PK)                                                                                   |
| plate (FK → vehicles.plate, NOT NULL, RESTRICT/RESTRICT)                                   |
| category_id (FK → categories.id, NOT NULL, RESTRICT/CASCADE)                               |
| registered_by (FK → users.id, NOT NULL, RESTRICT/CASCADE)                                  |
| entry_time (NOT NULL, DEFAULT NOW())                                                       |
| exit_time (NULL hasta salida)                                                             |
| total_minutes (NULL, calculado al salir)                                                   |
| total_cost (NULL, calculado al salir)                                                      |
| status (ENUM: 'active', 'completed', DEFAULT active)                                       |
| created_at                                                                                 |
| updated_at                                                                                 |
+-------------------------------------------------------------------------------------------+

Índice único parcial:
  idx_parking_active_plate  UNIQUE (plate) WHERE status = 'active'
```

---

## 4. Definición de Tablas

### 4.1 Tabla: `users`

**Propósito:** Almacena los usuarios del sistema (empleados y administradores).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identificador único autoincremental |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Correo electrónico del usuario (usado para login) |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt de la contraseña |
| `name` | VARCHAR(100) | NOT NULL | Nombre completo del usuario |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('admin', 'employee') | Rol del usuario en el sistema |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado activo/inactivo (soft delete) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de última actualización |

**Índices:**
- `idx_users_email` — B-tree en `email` (UNIQUE). Justificación: login y unicidad de correo.

**Notas de implementación:**
- El campo `role` usa VARCHAR con CHECK constraint en lugar de ENUM nativo para mayor flexibilidad.
- `is_active` permite desactivar empleados sin perder el historial de registros asociados.

---

### 4.2 Tabla: `categories`

**Propósito:** Almacena las categorías de vehículos con su tarifa por minuto.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identificador único autoincremental |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Nombre de la categoría (ej: "Oficial", "Residente", "No Residente") |
| `description` | TEXT | NULL | Descripción opcional de la categoría |
| `price_per_minute` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Tarifa por minuto en MXN |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado activo/inactivo (soft delete) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de última actualización |

**Índices:**
- `idx_categories_name` — B-tree en `name` (UNIQUE). Justificación: regla de negocio #2 (nombres únicos).

**Notas de implementación:**
- `price_per_minute` es editable por el admin. La semilla inicial establece: Oficial = $0.00, Residente = $1.00, No Residente = $3.00.
- `is_active` permite desactivar categorías sin romper integridad referencial. FK RESTRICT impide DELETE físico.
- `DECIMAL(10,2)` permite valores hasta 99,999,999.99 MXN con precisión de centavos.

---

### 4.3 Tabla: `parking_records`

**Propósito:** Registra cada estancia de un vehículo en el estacionamiento (entrada/salida).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identificador único autoincremental |
| `plate` | VARCHAR(20) | NOT NULL, FK → vehicles.plate | Número de placa del vehículo (debe existir en tabla vehicles) |
| `entry_time` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de entrada (automática) |
| `exit_time` | TIMESTAMP | NULL | Fecha y hora de salida (se asigna al registrar salida) |
| `total_minutes` | INTEGER | NULL | Minutos estacionados (calculado al salir) |
| `total_cost` | DECIMAL(10,2) | NULL | Costo total en MXN (calculado al salir) |
| `category_id` | INTEGER | NOT NULL, FK → categories.id | Categoría del vehículo al momento de entrada |
| `registered_by` | INTEGER | NOT NULL, FK → users.id | Usuario (empleado/admin) que registró la entrada |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'active', CHECK IN ('active', 'completed') | Estado del registro de estacionamiento |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de última actualización |

**Índices:**
- `idx_parking_active_plate` — **UNIQUE parcial** en `plate` WHERE `status = 'active'`. Justificación: regla de negocio #1 (unicidad de placa activa).
- `idx_parking_entry_time` — B-tree en `entry_time`. Justificación: reportes por rango de fechas.
- `idx_parking_category` — B-tree en `category_id`. Justificación: JOIN con categorías y filtros por tipo.
- `idx_parking_status` — B-tree en `status`. Justificación: filtrar vehículos activos (vista de cobro).

**Notas de implementación:**
- `entry_time` se asigna automáticamente con DEFAULT NOW(). No es ingresada manualmente.
- `exit_time`, `total_minutes` y `total_cost` se calculan al registrar la salida.
- `total_minutes = CEIL(EXTRACT(EPOCH FROM (exit_time - entry_time)) / 60)` (minutos redondeados hacia arriba).
- `total_cost = total_minutes × categories.price_per_minute`.
- El índice único parcial `idx_parking_active_plate` garantiza a nivel BD que nunca haya dos registros activos con la misma placa.

---

### 4.4 Tabla: `vehicles`

**Propósito:** Registra los vehículos conocidos con su categoría por defecto. Sirve como catálogo para auto-completar datos al registrar entradas y como referencia en reportes.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identificador único autoincremental |
| `plate` | VARCHAR(20) | NOT NULL, UNIQUE | Número de placa del vehículo (único en el sistema) |
| `category_id` | INTEGER | NOT NULL, FK → categories.id | Categoría por defecto del vehículo |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Estado activo/inactivo (soft delete) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de creación del registro |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Fecha y hora de última actualización |

**Índices:**
- `idx_vehicles_plate` — B-tree en `plate` (UNIQUE). Justificación: unicidad de placa en el catálogo.
- `idx_vehicles_category` — B-tree en `category_id`. Justificación: consultas por categoría de vehículo.

**Notas de implementación:**
- La placa en `parking_records` es FK a `vehicles.plate`, garantizando integridad referencial.
- Si al registrar una entrada la placa no existe en `vehicles`, se crea automáticamente con la categoría seleccionada.
- `is_active` permite desactivar vehículos sin eliminar su historial en `parking_records`.
- Un vehículo desactivado bloquea el registro de entradas y salidas con esa placa.
- Solo el admin puede editar la categoría o desactivar/reactivar vehículos. Los empleados pueden consultar la lista.
- La placa NO se puede modificar (ON UPDATE RESTRICT en la FK desde parking_records).

---

## 5. Relaciones (Foreign Keys)

| FK (origen) | Referencia (destino) | ON DELETE | ON UPDATE | Justificación |
|-------------|---------------------|-----------|-----------|---------------|
| `vehicles.category_id` | `categories.id` | RESTRICT | CASCADE | Protege integridad: no se puede borrar categoria con vehiculos asociados. |
| `parking_records.plate` | `vehicles.plate` | RESTRICT | RESTRICT | Integridad referencial: toda placa en estacionamiento debe existir en vehicles. No se permite borrar vehiculo con historial ni cambiar su placa. |
| `parking_records.category_id` | `categories.id` | RESTRICT | CASCADE | Protege integridad: no se puede borrar categoria con registros. Soft delete es la alternativa. |
| `parking_records.registered_by` | `users.id` | RESTRICT | CASCADE | Protege integridad: no se puede borrar usuario con registros asociados. Soft delete es la alternativa. |

**Comportamiento:**
- `ON DELETE RESTRICT`: PostgreSQL rechazará el DELETE si existen registros dependientes.
- `ON UPDATE CASCADE`: Si el ID de la categoría o usuario cambia, se actualiza automáticamente en los registros dependientes.

---

## 6. Índices

| Nombre | Tabla | Columnas | Tipo | Justificación |
|--------|-------|----------|------|---------------|
| `idx_users_email` | users | email | B-tree (UNIQUE) | Login y unicidad de correo |
| `idx_categories_name` | categories | name | B-tree (UNIQUE) | Regla de negocio #2: nombres únicos |
| `idx_vehicles_plate` | vehicles | plate | B-tree (UNIQUE) | Regla de negocio #10: placas únicas en el catálogo |
| `idx_vehicles_category` | vehicles | category_id | B-tree | JOIN con categorías, filtros por tipo de vehículo |
| `idx_parking_active_plate` | parking_records | plate | B-tree (UNIQUE parcial WHERE status = 'active') | Regla de negocio #1: unicidad de placa activa |
| `idx_parking_entry_time` | parking_records | entry_time | B-tree | Reportes por rango de fechas |
| `idx_parking_category` | parking_records | category_id | B-tree | JOIN con categorías, filtros por tipo |
| `idx_parking_status` | parking_records | status | B-tree | Filtrar vehículos activos (vista de cobro) |

---


### 7 Seed Inicial Esperado (Referencia, sin código)

```
users:
  - admin@parking.com / password: admin123 / role: admin
  - employee@parking.com / password: employee123 / role: employee

categories:
  - name: "Oficial" / price_per_minute: 0.00 / is_active: true
  - name: "Residente" / price_per_minute: 1.00 / is_active: true
  - name: "No Residente" / price_per_minute: 3.00 / is_active: true

vehicles:
  - plate: "ABC123" / category_id: 2 (Residente)
  - plate: "DEF456" / category_id: 3 (No Residente)
  - plate: "GHI789" / category_id: 1 (Oficial)
  - plate: "JKL012" / category_id: 3 (No Residente)
  - plate: "MNO345" / category_id: 2 (Residente)

parking_records:
  - 4 registros completados + 1 activo (JKL012)
```