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

## Roles y autenticación

- Usuario `superadmin` (email `superadmin@peluqueria.com`) · contraseña `superadmin`
- Usuario `ana` (email `ana@peluqueria.com`) · contraseña `admin123`

> Reiniciá el servidor cada vez que modifiques las credenciales semilla. El superadmin puede crear más usuarios admin mediante `POST /api/superadmin/admins` (y desde la UI en la sección “Administradores”). Las contraseñas se almacenan en memoria usando `bcryptjs`; al reiniciar el servidor se resetean los datos.

## Endpoints disponibles

- `POST /api/auth/login`
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
- `GET /api/public/staff`
- `GET /api/public/services`

> Todas las rutas (excepto login) requieren token Bearer. Usá el token devuelto en `/api/auth/login`.

### Persistencia local

La lista de profesionales se guarda en `src/data/staff.json`. Cada vez que agregás o eliminás un staff desde la API o el panel, el archivo se actualiza, por lo que los datos sobreviven a los reinicios del servidor.

Los turnos se guardan en `src/data/bookings.json`. Para compartir la estructura sin datos sensibles, usá `src/data/bookings.example.json` como referencia.

## Estructura de carpetas

- `src/app.js` — Configuración de Express y rutas.
- `src/routes/` — Rutas separadas por contexto (auth, servicios, métricas, etc.).
- `src/data/` — Datos en memoria (usuarios, turnos, catálogos).
- `src/middleware/` — Middlewares de autenticación y autorización.
- `src/utils/` — Utilidades (JWT helpers).
