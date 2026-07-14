# Reporte de Prueba: Flujo Arquitectura MVC + 3 Capas

Fecha: 2026-07-13
Entorno: Docker (postgres:13, node:18, pgadmin:4)
Base URL: http://localhost:3000

---

## Resultados por Paso

| # | Endpoint | Método | Status | Body | Capa(s) verificada(s) | Resultado |
|:-:|----------|:------:|:------:|------|-----------------------|:---------:|
| 1 | `/api/v1` | `GET` | **200** | `{"message":"API v1 running","version":"1.0.0"}` | Router central | ✅ |
| 2 | `/api/v1/auth/login` (admin) | `POST` | **200** | `{"user":{"id":1,"email":"admin@test.com","role":"admin"},"token":"eyJ..."}` | Middleware(validator) → Controller → AuthService → Passport → Model | ✅ |
| 3 | `/api/v1/users` | `GET` | **200** | 6 usuarios sin campo `password` | Middleware(apiKey+JWT) → Controller → Service(find) → Model(findAll) | ✅ |
| 4 | `/api/v1/users` (sin headers) | `GET` | **401** | `{"statusCode":401,"error":"Unauthorized","message":"apiKey is required"}` | Middleware(checkApiKey rechaza) | ✅ |
| 5 | `/api/v1/users` (token user) | `POST` | **401** | `{"statusCode":401,"error":"Unauthorized","message":"This role is not allowed"}` | Middleware(checkRoles rechaza) | ✅ |
| 6 | `/api/v1/users` (token admin + body válido) | `POST` | **201** | `{"id":7,"email":"creado-paso6@test.com","role":"user"}` | Middleware(validator) → Controller → Service(create+bcrypt) → Model | ✅ |
| 7 | `/api/v1/auth/register` | `POST` | **201** | `{"id":8,"email":"registrado-paso7@test.com","role":"user"}` | Controller → Service(create+bcrypt) → Model | ✅ |
| 8 | `/users/list` | `GET` | **200** | HTML `<table>` con listado de usuarios | Route → Controller → Service(find) → **Vista EJS** | ✅ |
| 9 | `/auth/login` | `GET` | **200** | HTML `<form>` de login | Route → Controller → **Vista EJS** | ✅ |
| 10 | `/api/v1/users` (body inválido) | `POST` | **400** | `"email" must be a valid email. "password" length must be at least 6 characters long. "role" is required` | Middleware(validatorHandler + Joi rechaza) | ✅ |

---

## Verificación de Seguridad

### Password hashing (bcrypt)
```
 id | email                | password_status                | role
----+----------------------+-------------------------------+-------
  1 | admin@test.com       | $2b$10$HZaEaE... (bcrypt)     | admin
  2 | user@test.com        | $2b$10$hS33N1... (bcrypt)     | user
  3 | registrado@test.com  | $2b$10$IR2aYr... (bcrypt)     | user
  5 | final@test.com       | $2b$10$TklnGb... (bcrypt)     | user
  6 | ultimo@test.com      | $2b$10$agIJ0k... (bcrypt)     | user
  7 | creado-paso6@test.com| $2b$10$BsFaEK... (bcrypt)     | user
  8 | registrado-paso7@test| $2b$10$OOGYvL... (bcrypt)     | user
```
Todos los passwords almacenados usan **bcrypt (salt rounds=10)**. ✅

### Password excluido en respuestas GET
El endpoint `GET /api/v1/users` no retorna el campo `password`. ✅

### Middleware checkApiKey
Rechaza requests sin header `api` con `401 Unauthorized`. ✅

### Middleware checkRoles
Rechaza requests de usuarios sin rol `admin` en endpoints protegidos con `401 Unauthorized`. ✅

### Middleware validatorHandler (Joi)
Valida schemas en `body`, `params`, `query` y rechaza con `400 Bad Request` + errores detallados. ✅

---

## Cobertura de Arquitectura

| Capa | Archivo(s) | Verificado |
|:-----|:-----------|:----------:|
| **Route** | `src/routes/index.js`, `user.routes.js`, `auth.routes.js` | ✅ Paso 1-10 |
| **Middleware (apiKey)** | `src/middlewares/auth.handler.js` | ✅ Paso 4 |
| **Middleware (JWT)** | `src/utils/auth/strategies/jwt.strategy.js` | ✅ Paso 3 |
| **Middleware (checkRoles)** | `src/middlewares/auth.handler.js` | ✅ Paso 5 |
| **Middleware (validator)** | `src/middlewares/validator.handler.js` | ✅ Paso 10 |
| **Controller** | `src/controllers/user.controller.js`, `auth.controller.js` | ✅ Paso 2-9 |
| **Service** | `src/services/user.service.js`, `auth.service.js` | ✅ Paso 2-7 |
| **Model (Sequelize)** | `src/db/models/user.model.js` | ✅ Paso 2-7 |
| **Vista (EJS)** | `src/views/users/list.ejs`, `auth/login.ejs` | ✅ Paso 8-9 |
| **Passport (local)** | `src/utils/auth/strategies/local.strategy.js` | ✅ Paso 2 |
| **Passport (JWT)** | `src/utils/auth/strategies/jwt.strategy.js` | ✅ Paso 3 |

---

## Resumen

| Indicador | Valor |
|:----------|:------|
| Endpoints probados | 10/10 |
| HTTP 200 (success) | 5 |
| HTTP 201 (created) | 2 |
| HTTP 400 (validation) | 1 |
| HTTP 401 (unauthorized) | 2 |
| Errores encontrados | 1 (fix aplicado: falta `await` en `AuthController.login` → corregido en `src/controllers/auth.controller.js:10`) |
| Bugs adicionales | 1 (fix aplicado: password se retornaba en `find()` y no se hasheaba en `create()` → `src/services/user.service.js` corregido) |
| Re-test post-fix | 10/10 ✅ |

**Estado general: ✅ Todos los flujos de la arquitectura funcionan correctamente. Bugs corregidos y verificados.**
