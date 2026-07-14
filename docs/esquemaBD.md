# Esquema de Base de Datos — Sistema de Gestión de Estacionamientos

## 1. Metadatos

| Propiedad | Valor |
|-----------|-------|
| Motor | PostgreSQL 13+ |
| Normalización | 3NF (Tercera Forma Normal) |
| Soft Delete | `categories.is_active`, `users.is_active` |
| Versión | 1.0.0 |
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
| 9 | Los usuarios con rol `employee` tienen acceso restringido a registro de entrada/salida y configuración de su propio perfil. |

---

## 3. Diagrama Entidad-Relación

```
+------------------+          +---------------------+
|     users        |          |    categories       |
+------------------+          +---------------------+
| id (PK)          |          | id (PK)             |
| email (UNIQUE)   |          | name (UNIQUE)       |
| password_hash    |          | description         |
| name             |          | price_per_minute    |
| role             |          | is_active           |
| is_active        |          | created_at          |
| created_at       |          | updated_at          |
| updated_at       |          +----------+----------+
+--------+---------+                     |
         |                               | 1:N
         | 1:N                           |
         |                               |
+--------v--------------------------------v----------+
|                  parking_records                     |
+------------------------------------------------------+
| id (PK)                                              |
| plate (NOT NULL)                                     |
| entry_time (NOT NULL, DEFAULT NOW())                  |
| exit_time (NULL hasta salida)                        |
| total_minutes (NULL, calculado al salir)              |
| total_cost (NULL, calculado al salir)                 |
| category_id (FK → categories.id, NOT NULL)            |
| registered_by (FK → users.id, NOT NULL)               |
| status (ENUM: 'active', 'completed', DEFAULT active)  |
| created_at                                            |
| updated_at                                            |
+------------------------------------------------------+

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
| `plate` | VARCHAR(20) | NOT NULL | Número de placa del vehículo |
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

## 5. Relaciones (Foreign Keys)

| FK (origen) | Referencia (destino) | ON DELETE | ON UPDATE | Justificación |
|-------------|---------------------|-----------|-----------|---------------|
| `parking_records.category_id` | `categories.id` | RESTRICT | CASCADE | Protege integridad: no se puede borrar categoría con registros. Soft delete es la alternativa. |
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
| `idx_parking_active_plate` | parking_records | plate | B-tree (UNIQUE parcial WHERE status = 'active') | Regla de negocio #1: unicidad de placa activa |
| `idx_parking_entry_time` | parking_records | entry_time | B-tree | Reportes por rango de fechas |
| `idx_parking_category` | parking_records | category_id | B-tree | JOIN con categorías, filtros por tipo |
| `idx_parking_status` | parking_records | status | B-tree | Filtrar vehículos activos (vista de cobro) |

---

## 7. Verificación de 3NF

| Tabla | 1NF (atómicos) | 2NF (no dependencia parcial) | 3NF (no dependencia transitiva) |
|-------|:---:|:---:|:---:|
| users | ✅ Todos los campos son atómicos | ✅ PK simple, no hay dependencias parciales | ✅ `role` depende solo de `id`, no de otros atributos |
| categories | ✅ Todos los campos son atómicos | ✅ PK simple, no hay dependencias parciales | ✅ `price_per_minute` depende solo de `id`, no de otros atributos |
| parking_records | ✅ Todos los campos son atómicos | ✅ PK simple, no hay dependencias parciales | ✅ `total_cost` es calculado (no almacena dependencia transitiva) |

**Nota sobre `total_cost`:** Aunque `total_cost = total_minutes × price_per_minute`, este campo se almacena por razones de rendimiento e historial. Si la tarifa cambia en el futuro, el costo histórico permanece correcto. No es una dependencia transitiva que viole 3NF porque `total_cost` no depende de ningún atributo no-clave de `parking_records`; es un valor derivado calculado al momento de la salida.

---

## 8. Estrategia de Soft Delete

| Tabla | Campo | Comportamiento |
|-------|-------|----------------|
| `categories` | `is_active` | Admin desactiva (no elimina) si hay `parking_records` asociados. FK RESTRICT bloquea DELETE físico. |
| `users` | `is_active` | Futuro: desactivar empleados sin perder historial de registros. FK RESTRICT bloquea DELETE físico. |

**Regla:** Los endpoints de eliminación (DELETE) deben verificar `is_active = false` en lugar de ejecutar DELETE físico cuando existan registros dependientes.

---

## 9. Notas para Implementación

### 9.1 Flujo de Registro de Entrada (POST /api/v1/parking/entry)

```
1. Recibir: { plate, category_id }
2. Validar que category_id existe y is_active = true
3. INSERT INTO parking_records (plate, category_id, registered_by, status)
   VALUES (?, ?, ?, 'active')
   -- entry_time se asigna automáticamente con DEFAULT NOW()
4. Si falla por idx_parking_active_plate → error "placa ya tiene estancia activa"
5. Retornar: { id, plate, entry_time, category, status }
```

### 9.2 Flujo de Registro de Salida (POST /api/v1/parking/exit)

```
1. Recibir: { plate }
2. SELECT * FROM parking_records WHERE plate = ? AND status = 'active'
3. Si no existe → error "no hay estancia activa para esta placa"
4. exit_time = NOW()
5. total_minutes = CEIL(EXTRACT(EPOCH FROM (exit_time - entry_time)) / 60)
6. Obtener categories.price_per_minute vía category_id
7. total_cost = total_minutes × price_per_minute
8. UPDATE parking_records
   SET exit_time = ?, total_minutes = ?, total_cost = ?, status = 'completed'
   WHERE id = ?
9. Retornar: { plate, entry_time, exit_time, total_minutes, total_cost, category }
```

### 9.3 Validación de Entrada Activa (Aplicación)

```
Antes de INSERT en parking_records:
1. SELECT COUNT(*) FROM parking_records WHERE plate = ? AND status = 'active'
2. Si COUNT > 0 → rechazar con error 409 "placa ya tiene estancia activa"
3. Alternativa: el partial unique index lo hará automáticamente, pero es mejor capturar el error y retornar mensaje amigable
```

### 9.4 Seed Inicial Esperado (Referencia, sin código)

```
users:
  - admin@parking.com / password: admin123 / role: admin
  - employee@parking.com / password: employee123 / role: employee

categories:
  - name: "Oficial" / price_per_minute: 0.00 / is_active: true
  - name: "Residente" / price_per_minute: 1.00 / is_active: true
  - name: "No Residente" / price_per_minute: 3.00 / is_active: true
```

### 9.5 Consultas Comunes para Reportes

```sql
-- Vehículos actualmente estacionados
SELECT pr.*, c.name as category_name
FROM parking_records pr
JOIN categories c ON pr.category_id = c.id
WHERE pr.status = 'active';

-- Reporte por rango de fechas
SELECT pr.*, c.name as category_name, u.name as registered_by_name
FROM parking_records pr
JOIN categories c ON pr.category_id = c.id
JOIN users u ON pr.registered_by = u.id
WHERE pr.exit_time BETWEEN ? AND ?
ORDER BY pr.exit_time DESC;

-- Ingresos totales por período
SELECT
  SUM(total_cost) as total_revenue,
  COUNT(*) as total_vehicles,
  AVG(total_minutes) as avg_minutes
FROM parking_records
WHERE exit_time BETWEEN ? AND ?
  AND status = 'completed';

-- Ingresos por categoría
SELECT
  c.name as category_name,
  SUM(pr.total_cost) as category_revenue,
  COUNT(*) as vehicle_count
FROM parking_records pr
JOIN categories c ON pr.category_id = c.id
WHERE pr.exit_time BETWEEN ? AND ?
  AND pr.status = 'completed'
GROUP BY c.id, c.name;
```

---

## 10. Consideraciones de Rendimiento

- **Índice parcial:** `idx_parking_active_plate` es eficiente porque solo indexa registros activos (típicamente pocos cientos vs miles de históricos).
- **Particionado futuro:** Si la tabla `parking_records` crece >1M registros, considerar particionado por `entry_time` (mensual/anual).
- **Archivado:** Planear archivado de registros completados >1 año a tabla `parking_records_archive`.

---

**Fin del documento.**
