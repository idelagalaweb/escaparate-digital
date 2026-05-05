# Guía de Prueba Real: InmoIA Escaparate sobre BrightSign

Esta guía detalla los pasos para validar el sistema en hardware físico antes del despliegue final.

## 1. Preparación de Infraestructura
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Crea una **Realtime Database** en modo prueba (luego aplica `FIREBASE_RULES.json`).
3. Registra una Web App en el proyecto para obtener las credenciales.
4. Copia `.env.example` a `.env.local` y rellena los datos.

## 2. Configuración del BrightSign
Cada equipo debe configurarse para cargar la URL de la aplicación con su parámetro correspondiente:
- **TV Superior:** `https://tu-app.web.app/player?screen=top`
- **TV Central:** `https://tu-app.web.app/player?screen=middle`
- **TV Inferior:** `https://tu-app.web.app/player?screen=bottom`

## 3. Fase de Diagnóstico (Crítico)
Antes de lanzar contenido, abre en cada BrightSign la URL de compatibilidad:
`https://tu-app.web.app/compatibility`

Verifica que todos los tests estén en **PASSED**:
- **JS Moderno:** Valida que el motor del navegador soporta ES6.
- **Conexión C2:** Valida que el equipo llega a Firebase.
- **LocalStorage:** Valida que la persistencia offline funcionará.
- **Video:** Valida el códec para aceleración por hardware.

## 4. Pruebas de Control (C2)
Desde el Dashboard (`/dashboard`):
1. **Heartbeat:** Verifica que los 3 equipos aparecen como `ONLINE`.
2. **Pausa/Resume:** Pulsa PAUSE y verifica que los 3 equipos muestran el badge `COMPLETED` y detienen la imagen.
3. **Campaña Conjunta:** Verifica que el cambio de contenido es simultáneo (latencia < 500ms).

## 5. Validación Offline
1. Desconecta el cable de red de un BrightSign.
2. El Dashboard debe marcarlo como `OFFLINE` tras 5-10 segundos.
3. El equipo debe seguir reproduciendo el último contenido gracias al **Fast Boot Cache**.
4. Reconecta el cable y verifica que recupera la sincronización automáticamente.

---
**Nota:** Si el BrightSign muestra una pantalla blanca, verifica el `User Agent` en la pantalla de compatibilidad; algunos firmwares antiguos requieren un polyfill de Fetch.
