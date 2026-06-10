# LocalBot Dashboard — React + Font Awesome

## Dependencias necesarias

```bash
npm install @fortawesome/fontawesome-free
```

## Archivos

| Archivo | Descripción |
|---|---|
| `Dashboard.jsx` | Componente principal del dashboard |
| `dashboard.css` | Sistema de diseño completo (tokens, componentes) |

## Uso en tu proyecto

1. Copia `Dashboard.jsx` y `dashboard.css` a `frontend/src/pages/`
2. Instala Font Awesome: `npm install @fortawesome/fontawesome-free`
3. El import del CSS de FA ya está dentro del componente
4. Ajusta las rutas del sidebar a tu router (react-router-dom)

## Para conectar datos reales

Reemplaza los arrays en la sección `// ─── Mock Data ───` con tus hooks:

```jsx
// En Dashboard.jsx, en lugar de los arrays mock:
const { appointments } = useAppointments({ date: today });
const { conversations } = useConversations({ limit: 5 });
```

## Estructura de colores

Todos los colores están como CSS custom properties en `:root` en `dashboard.css`.
Para cambiar el acento verde: modifica `--lb-green`.
