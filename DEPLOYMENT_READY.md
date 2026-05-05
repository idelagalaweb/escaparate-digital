# SISTEMA DESPLEGADO: InmoIA Escaparate Digital

El build de producción ha sido generado con éxito. El sistema está listo para ser desplegado en hardware BrightSign.

## 1. Variables de Entorno Requeridas
Asegúrate de configurar estas variables en tu proveedor de hosting (Vercel, Netlify, etc.):
- `VITE_C2_TRANSPORT=firebase`
- `VITE_SITE_ID=delagala-escaparate-01`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

## 2. URLs de Operación
Sustituye `[URL_BASE]` por la URL de tu despliegue (ej. `https://escaparate.delagala.com`):

- **Centro de Control (Dashboard):** `[URL_BASE]/dashboard`
- **Diagnóstico de Hardware:** `[URL_BASE]/compatibility`
- **TV Superior:** `[URL_BASE]/player?screen=top`
- **TV Central:** `[URL_BASE]/player?screen=middle`
- **TV Inferior:** `[URL_BASE]/player?screen=bottom`

## 3. Guía de Inicio Rápido
1. Abre el **Dashboard** y verifica que no aparezca el aviso de "Modo Simulación" (esto confirma que Firebase está activo).
2. Abre la URL de la **TV Superior** en una pestaña de incógnito.
3. El Dashboard debería detectar el player "top" instantáneamente.
4. Envía un comando de `PAUSE` y verifica el `ACK` en el Dashboard.

## 4. Fallback y Resiliencia
- **Sin Internet:** El sistema usará el `Fast Boot Cache` local.
- **Error Firebase:** Cambia `VITE_C2_TRANSPORT=local` en el entorno para volver a modo demo si hay problemas con la base de datos.
- **Rutas 404:** Se han incluido archivos `_redirects` y `vercel.json` para asegurar que el routing de la SPA funcione en cualquier servidor.

---
**Build ID:** 2026-05-05-v1-industrial
