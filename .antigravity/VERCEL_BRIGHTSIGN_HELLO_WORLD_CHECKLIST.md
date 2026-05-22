# Checklist de Preparación: Vercel + BrightSign Hello World C2

Este documento contiene los pasos y validaciones necesarias para desplegar el proyecto en Vercel y probar la comunicación bidireccional (C2) de manera real usando hardware BrightSign.

## 1. Configuración en Vercel (Variables de Entorno)

Antes de abrir el Dashboard de producción, asegúrate de que el proyecto en Vercel tenga configuradas las siguientes variables de entorno. 
> **Nota:** Puedes hacerlo desde `Project Settings > Environment Variables` en Vercel.

- `VITE_C2_TRANSPORT` = `firebase`
- `VITE_SITE_ID` = `delagala-escaparate-01`
- `VITE_FIREBASE_API_KEY` = `[tu-api-key]`
- `VITE_FIREBASE_AUTH_DOMAIN` = `[tu-auth-domain]`
- `VITE_FIREBASE_DATABASE_URL` = `[tu-database-url]`
- `VITE_FIREBASE_PROJECT_ID` = `[tu-project-id]`
- `VITE_FIREBASE_APP_ID` = `[tu-app-id]`

## 2. Rutas Finales de Producción

Una vez desplegado con las variables anteriores, estas son las URL exactas a utilizar:

- **Dashboard de Control:**
  `https://[TU_DOMINIO_VERCEL]/`
- **Player para BrightSign (TV Superior):**
  `https://[TU_DOMINIO_VERCEL]/?screen=top&debug=true`

## 3. Verificación Rápida del Modo C2

Para asegurar que estás transmitiendo de forma real a través de Firebase:
- En el **Dashboard**, revisa el indicador en la barra superior derecha. Debe mostrar `REAL (C2)` resaltado en color verde. Si ves una advertencia naranja de `SIMULACIÓN ACTIVA`, significa que Vercel no está cargando tu API KEY correctamente.
- En el **Player**, revisa el panel de depuración (arriba a la izquierda, habilitado con `debug=true`). En la sección "TRANSPORT", debe indicar `FIREBASE` (y no `SIMULATION`).

## 4. Prueba de Ejecución en Vivo

1. Abre el Dashboard en Vercel desde tu móvil o PC.
2. Abre la URL del Player en el dispositivo BrightSign físico o, alternativamente, en una ventana de incógnito en otra red.
3. En el panel izquierdo del Dashboard, busca la sección **Prueba Hello World C2** (de color morado).
4. Escribe el mensaje: `"Hola mundo desde Vercel"`.
5. Selecciona el target a **TV SUPERIOR (TOP)** o **TODAS LAS PANTALLAS (ALL)**.
6. Pulsa **Enviar a Pantalla**.

### Qué debe ocurrir en la TV (Player):
- La reproducción habitual se interrumpe y la pantalla pasa a un fondo oscuro `#09090b`.
- Aparece de inmediato el mensaje en blanco, gigantesco y centrado.
- Se muestran dos líneas horizontales moradas con el texto **ESCAPARATE C2 TEST** por encima del mensaje.
- El panel de depuración actualizará la sección **Último Recibido** con el comando `DISPLAY_MESSAGE` y la hora exacta de recepción en tiempo real.

### Qué revisar en caso de fallo:
- **El Dashboard no carga:** Verifica si hubo algún error en el build de Vercel.
- **Modo simulación forzado:** Faltan variables en Vercel. Asegúrate de hacer *redeploy* después de añadir las variables de entorno.
- **El Player en BrightSign está negro/blanco y no carga el mensaje:** Verifica la conexión a Internet del BrightSign y la hora del sistema (si difiere significativamente, el certificado SSL de Firebase/Vercel será rechazado).
