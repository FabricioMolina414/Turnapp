# TurnApp

Turnero web pensado para peluquerías y servicios de manicura. Proyecto inicial armado con Vite + React y enfoque *mobile first*.

## Scripts frontend disponibles

Instalá las dependencias y levantá el entorno local:

```bash
npm install
npm run dev
```

> ⚠️ La librería de componentes Sera UI no está incluida en el repositorio. Instalala siguiendo la documentación oficial (por ejemplo `npm install sera-ui`) y ajustá los imports una vez que confirmemos los nombres de los componentes.

Construí la versión para producción:

```bash
npm run build
```

Previsualizá la build:

```bash
npm run preview
```

### Build y dev del panel admin

- Modo desarrollo: `npm run dev:admin` (abre la app en `http://localhost:5173/admin.html`).
- Build de producción: `npm run build` también genera `dist/admin.html` y los assets del panel.
- Configurá la variable `VITE_API_URL` (por ejemplo en `.env`) para apuntar al backend Express: `VITE_API_URL=http://localhost:4000/api`.

## Backend Express (entorno local)

El repositorio incluye un backend básico en `server/` con Express, pensado para mockear la API hasta conectar una base de datos real.

1. Copiá el archivo de entorno:

   ```bash
   cd server
   cp .env.example .env
   ```

2. Instalá dependencias y levantá el servidor en modo watch:

   ```bash
   npm install
   npm run dev
   ```

   Desde la raíz también podés usar `npm run server:dev`.

### Endpoints principales

- `POST /api/auth/login` — Autenticación con email/contraseña.
- `GET /api/auth/me` — Información del usuario autenticado.
- `GET /api/appointments/week` — Agenda semanal (requiere rol `admin` o `superadmin`).
- `GET /api/services` — Catálogo interno de servicios (roles `admin` o `superadmin`).
- `GET /api/metrics/monthly` — Métricas de negocio (roles `admin` o `superadmin`).
- `GET /api/staff` — Listado de profesionales para el panel (roles `admin` o `superadmin`).
- `POST /api/staff` — Alta de profesionales (roles `admin` o `superadmin`).
- `DELETE /api/staff/:id` — Baja de profesionales (roles `admin` o `superadmin`).
- `POST /api/superadmin/admins` — Crear usuarios admin (solo rol `superadmin`).
- `GET /api/public/staff` — Listado público de profesionales que consume el sitio de reservas.
- `GET /api/public/services` — Servicios públicos (útil para ampliar la reserva en el front).

> Los profesionales se persisten en `server/src/data/staff.json`. Cada alta/baja actualiza ese archivo, por lo que los cambios se conservan entre reinicios del backend.

### Roles y credenciales semilla

- **Superadmin:** usuario `superadmin` (email `superadmin@peluqueria.com`) · contraseña `superadmin`
- **Admin demo:** usuario `ana` (email `ana@peluqueria.com`) · contraseña `admin123`

> Recordá reiniciar el servidor (`Ctrl+C` y `npm run server:dev` otra vez) cada vez que cambiemos la semilla de usuarios. El superadmin es el único que puede invitar nuevos usuarios con rol admin desde la opción **Administradores** del panel. Las contraseñas se almacenan con `bcryptjs`; al reiniciar el servidor los datos vuelven al estado inicial (in-memory).

## Próximos pasos

- Integrar Sera UI para reemplazar los estilos manuales.
- Conectar el flujo de reserva con un backend o proveedor de agenda.
- Agregar formularios para capturar datos de clientes y enviar notificaciones.
