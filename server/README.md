# Backend Express (Turnapp)

API mock para el proyecto Turnapp. Está pensada para desarrollo local hasta que la infraestructura real esté lista.

## Scripts

```bash
npm install     # instala dependencias
npm run dev     # nodemon src/index.js
npm run start   # node src/index.js
```

## Variables de entorno

Duplicá `.env.example` a `.env`. Variables disponibles:

- `PORT` — Puerto de escucha (por defecto 4000).
- `JWT_SECRET` — Clave usada para firmar los tokens JWT.
- `JWT_EXPIRES_IN` *(opcional)* — Tiempo de expiración, por defecto `1d`.
- `GOOGLE_CLIENT_ID` *(opcional)* — Client ID de Google OAuth para login en el panel admin.

## Roles y autenticación

- Usuario `superadmin` (email `superadmin@peluqueria.com`) · contraseña `superadmin`
- Usuario `ana` (email `ana@peluqueria.com`) · contraseña `admin123`

> Reiniciá el servidor cada vez que modifiques las credenciales semilla. El superadmin puede crear más usuarios admin mediante `POST /api/superadmin/admins` (y desde la UI en la sección “Administradores”). Las contraseñas se almacenan en memoria usando `bcryptjs`; al reiniciar el servidor se resetean los datos.

Si se usa `POST /api/auth/google`, los usuarios nuevos quedan con rol `staff` por defecto y luego un superadmin puede promoverlos.

## Endpoints disponibles

- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `GET /api/appointments/week`
- `GET /api/appointments/day/:isoDate`
- `GET /api/services`
- `GET /api/metrics/monthly`
- `GET /api/staff`
- `POST /api/staff`
- `DELETE /api/staff/:id`
- `GET /api/superadmin/admins`
- `POST /api/superadmin/admins`
- `PATCH /api/superadmin/admins/:id`
- `PATCH /api/superadmin/admins/:id/password`
- `DELETE /api/superadmin/admins/:id`
- `GET /api/public/staff`
- `GET /api/public/services`

> Todas las rutas (excepto login) requieren token Bearer. Usá el token devuelto en `/api/auth/login`.

### Persistencia en base de datos

Staff y turnos se guardan en Postgres usando Prisma (tablas `AppStaff` y `AppBooking`).

Si actualizaste el proyecto, corré la migración pendiente:

```bash
npm run prisma:migrate
```

## Estructura de carpetas

- `src/app.js` — Configuración de Express y rutas.
- `src/routes/` — Rutas separadas por contexto (auth, servicios, métricas, etc.).
- `src/data/` — Datos en memoria (usuarios, turnos, catálogos).
- `src/middleware/` — Middlewares de autenticación y autorización.
- `src/utils/` — Utilidades (JWT helpers).
