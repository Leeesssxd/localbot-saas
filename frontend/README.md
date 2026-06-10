# LocalBot Frontend

Panel React para administrar un negocio conectado a WhatsApp.

## Incluye

- `Login` con autenticación JWT.
- `Dashboard` con métricas, actividad semanal, agenda y alertas.
- `Calendar` con FullCalendar y modal de detalle.
- `Services` para crear, editar y eliminar servicios.
- `Settings` para horario, mensajes del bot y datos de WhatsApp.
- `AppShell` con sidebar, topbar y navegación responsive.

## Diseño

Este frontend mezcla dos direcciones visuales:

- La propuesta más completa aportó la estructura de panel y el lenguaje visual más robusto.
- La otra propuesta aportó la lectura ejecutiva de métricas y actividad reciente.

El resultado final mantiene el flujo funcional del frontend original, pero con una presentación más premium, sin emojis y con íconos SVG locales.

## Variables de entorno

- `VITE_API_URL`: URL base del backend en Railway o en local.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
