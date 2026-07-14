# Guía de Prueba Postman - Flujo Completo de Arquitectura

## Credenciales de prueba

| Variable | Valor |
|----------|-------|
| API Key | `test-api-key-2024` |
| Admin | `admin@test.com` / `admin123` |
| User | `user@test.com` / `user123` |
| Base URL | `http://localhost:3000` |

---

## Paso 1: Router
Verifica que el router central `src/routes/index.js` carga correctamente.

```
GET http://localhost:3000/api/v1
Headers: ninguna
Body: ninguno
```
**Capa verificada:** Route
**Respuesta esperada:** `200` → `{"message":"API v1 running","version":"1.0.0"}`

---

## Paso 2: Passport Local Strategy + AuthService
Verifica autenticación. Passport local-strategy valida email/password via `AuthService.getUser()`, que busca en BD y compara con bcrypt.

```
POST http://localhost:3000/api/v1/auth/login
Headers:
  Content-Type: application/json
Body (raw JSON):
  {
    "email": "admin@test.com",
    "password": "admin123"
  }
```
**Capas verificadas:** Middleware (validatorHandler) → Controller → Service (AuthService) → Model (User)
**Respuesta esperada:** `200` → `{"user":{...},"token":"eyJ..."}`

> Guarda el `token` para los siguientes pasos.

---

## Paso 3: API Key + JWT + Service + Model (LISTAR)
Verifica los middlewares de seguridad y acceso a datos.

```
GET http://localhost:3000/api/v1/users
Headers:
  api: test-api-key-2024
  Authorization: Bearer <TOKEN_ADMIN>
```
**Capas verificadas:** Middleware (checkApiKey) → Middleware (passport-jwt) → Controller → Service (find) → Model (findAll)
**Respuesta esperada:** `200` → Array de usuarios sin campo `password`

---

## Paso 4: Middleware apiKey - Rechazo
Verifica que sin API Key el middleware `auth.handler.js:checkApiKey` bloquea.

```
GET http://localhost:3000/api/v1/users
Headers: ninguna
```
**Capa verificada:** Middleware (checkApiKey rechaza)
**Respuesta esperada:** `401` → `{"statusCode":401,"error":"Unauthorized","message":"apiKey is required"}`

---

## Paso 5: Middleware checkRoles - Rechazo (user sin rol admin)
Verifica que `checkRoles('admin')` bloquea a usuarios con rol `user`.

```
POST http://localhost:3000/api/v1/users
Headers:
  Content-Type: application/json
  api: test-api-key-2024
  Authorization: Bearer <TOKEN_USER>
Body (raw JSON):
  {
    "email": "nuevo@test.com",
    "password": "123456",
    "role": "user"
  }
```
> Usa el token del login como `user@test.com` (rol user).

**Capa verificada:** Middleware (checkRoles rechaza)
**Respuesta esperada:** `401` → `{"statusCode":401,"error":"Unauthorized","message":"This role is not allowed"}`

---

## Paso 6: Validator Joi + Controller + Model (CREAR con éxito)
Verifica creación exitosa con validación Joi, solo admin.

```
POST http://localhost:3000/api/v1/users
Headers:
  Content-Type: application/json
  api: test-api-key-2024
  Authorization: Bearer <TOKEN_ADMIN>
Body (raw JSON):
  {
    "email": "creado@test.com",
    "password": "123456",
    "role": "user"
  }
```
**Capas verificadas:** Middleware (validatorHandler) → Controller → Service (create/bcrypt) → Model (create)
**Respuesta esperada:** `201` → user sin password, password hasheado en BD

---

## Paso 7: Controller + Service + Model (REGISTRO público)
Verifica el flujo de registro sin autenticación previa.

```
POST http://localhost:3000/api/v1/auth/register
Headers:
  Content-Type: application/json
Body (raw JSON):
  {
    "email": "registrado@test.com",
    "password": "123456"
  }
```
**Capas verificadas:** Middleware (validatorHandler) → Controller (hash delegado a Service) → Service (create) → Model
**Respuesta esperada:** `201` → `{"id":X,"email":"registrado@test.com","role":"user",...}`

---

## Paso 8: Vista EJS - Lista de usuarios
Verifica que `res.render()` genera HTML desde una vista .ejs.

```
GET http://localhost:3000/users/list
Headers: ninguna
```
**Capa verificada:** Route (viewRouter) → Controller (renderList) → Service (find) → Model → Vista EJS
**Respuesta esperada:** `200` → `<table>` HTML con usuarios (sin password)

---

## Paso 9: Vista EJS - Login
Verifica que el formulario de login se renderiza.

```
GET http://localhost:3000/auth/login
Headers: ninguna
```
**Capa verificada:** Route (viewRouter) → Controller (renderLogin) → Vista EJS
**Respuesta esperada:** `200` → Formulario HTML de login

---

## Paso 10: Validator Joi - Rechazo
Verifica que Joi valida y rechaza datos inválidos.

```
POST http://localhost:3000/api/v1/users
Headers:
  Content-Type: application/json
  api: test-api-key-2024
  Authorization: Bearer <TOKEN_ADMIN>
Body (raw JSON):
  {
    "email": "no-es-email",
    "password": "x"
  }
```
**Capa verificada:** Middleware (validatorHandler rechaza)
**Respuesta esperada:** `400` → `{"statusCode":400,"error":"Bad Request","message":"\"email\" must be a valid email. \"password\" length must be at least 6 characters long. \"role\" is required"}`

---

## Resumen de capas cubiertas

| Paso | Route | Middleware | Controller | Service | Model | Vista EJS |
|------|:-----:|:----------:|:----------:|:-------:|:-----:|:---------:|
| 1 | ✅ | — | — | — | — | — |
| 2 | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 3 | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 4 | ✅ | ✅ | — | — | — | — |
| 5 | ✅ | ✅ | — | — | — | — |
| 6 | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 7 | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 8 | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| 9 | ✅ | — | ✅ | — | — | ✅ |
| 10 | ✅ | ✅ | — | — | — | — |
