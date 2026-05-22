# ESCAPARATE / InmoIA360 Signage - Auditoría Técnica

## 1. Resumen Ejecutivo y Estado Actual del Proyecto

El proyecto es una aplicación web diseñada para operar como sistema de cartelería digital (digital signage) para pantallas en escaparates inmobiliarios, gestionado de forma remota. 

**Stack Detectado:**
- **Framework Core:** React 19, TypeScript, Vite 8
- **Estilos:** Tailwind CSS v4, PostCSS
- **Animaciones:** Framer Motion
- **Infraestructura Cloud / C2:** Firebase 12 (Realtime Database)
- **Estructura:** Single Page Application (SPA) con enrutamiento manual basado en parámetros de URL.

**Rutas Principales:**
- `/` -> **Dashboard:** Panel de control y monitorización de las pantallas.
- `/?screen=[top|middle|bottom]` -> **Player:** Reproductor a pantalla completa que se ejecuta en el hardware físico.
- `/diagnostics?screen=[top|middle|bottom]` -> **Diagnostics:** Herramienta de depuración técnica y verificación de tiempo/hardware.
- `/compatibility` -> **Compatibility:** Página de pruebas de soporte del navegador/dispositivo.

**Estado de Build/Dev:**
El proyecto compila sin errores a través de `vite build` y contiene scripts estándar en `package.json`. Actualmente se despliega en Vercel, y no muestra conflictos de dependencias graves a primera vista.

## 2. Arquitectura Técnica Actual

### Organización General
- **Dashboard (`src/dashboard`):** Emite comandos y monitoriza el latido (heartbeat) de los reproductores conectados. Dispone de un panel de auditoría (Registro C2) para revisar comandos emitidos.
- **Player (`src/player`):** Componente diseñado a 100% viewport (`100vw`/`100vh`) sin UI de navegación. Escucha comandos en tiempo real y usa el `Orchestrator` para saber qué renderizar.
- **Orquestador (`src/core/orchestrator`):** Motor sincrónico basado en tiempo (UTC determinista). Decide qué campaña e item (`PlaylistItem`) proyectar en una pantalla dada (`top`, `middle`, `bottom`) basándose en el segundo exacto. Esto garantiza sincronización frame a frame entre múltiples pantallas independientes (como 3 TVs BrightSign apiladas).

### Transporte de Comandos (C2 - Command & Control)
- **CommandBus (`src/sync/CommandBus.ts`):** Abstracción de transporte. Decide qué método usar para la comunicación entre el Dashboard y los Players.
- **FirebaseTransport (`FirebaseTransport.ts`):** Implementación para producción. Escribe y escucha sobre `Firebase Realtime Database`. 
  - Rutas en DB: `{siteId}/commands` (para comandos globales) y `{siteId}/players/{playerId}` (para presencia y heartbeats).
  - Escucha: Utiliza `onChildAdded` limitando al último elemento (`limitToLast(1)`) para reaccionar a comandos entrantes (PAUSE, RESUME, RELOAD_CONTENT).
- **LocalSimulationTransport:** Se activa si falta la configuración de Firebase o si la variable `VITE_C2_TRANSPORT` no es `firebase`. Útil para dev local sin red.

## 3. Solución Planteada Actualmente

La solución prevista es una red de displays hardware (BrightSign) ejecutando navegadores HTML5 que cargan la URL del player. 
- **El problema que resuelve:** Sincronizar contenido (campañas inmobiliarias monumentales) cruzando múltiples pantallas sin necesidad de cableado de sincronización especial de vídeo, usando simplemente sincronización por reloj (UTC) y notificaciones de estado por Firebase.
- **Implementado:** Sincronización UTC del orquestador, conexión a Firebase, monitorización onDisconnect, comandos de control de estado (PAUSE/RESUME), debug mode avanzado, layout cinematográfico.
- **Simulado/Pendiente:** Las campañas provienen de un archivo mock (`src/data/mockCampaigns.ts`). La integración real de ingesta de contenido (Sanity o CMS InmoIA360) no está finalizada.
- **Riesgos:** 
  1. **Clock Skew:** Si el reloj de hardware del BrightSign pierde sincronía NTP, las campañas se desfasarán visualmente entre pantallas.
  2. **WebSocket Limits:** Redes de tiendas muy restrictivas (firewalls) pueden bloquear los webSockets de Firebase Realtime Database.
  3. **Rendimiento de Hardware:** Si las animaciones CSS o vídeos de alta resolución son muy pesados, el navegador interno de un BrightSign básico podría tener caídas de framerate (stuttering).

## 4. Estado Operativo

- **Funciona hoy:** El ruteo por parámetros, el layout full-screen, el panel de diagnóstico, la escritura de comandos en Firebase (Dashboard -> Firebase) y la recepción de estos (Firebase -> Player).
- **Pendiente de integración:** CMS real para las campañas.
- **Dependencias del Entorno:**
  - `VITE_C2_TRANSPORT` (debe ser `firebase` en prod)
  - `VITE_SITE_ID` (ej: `delagala-escaparate-01`)
  - Claves de Firebase (`VITE_FIREBASE_API_KEY`, etc.)
- **Pruebas manuales:**
  - *Dashboard:* Abrir `http://localhost:5173/`
  - *Player (Top):* Abrir `http://localhost:5173/?screen=top&debug=true`
  - *Diagnóstico:* Abrir `http://localhost:5173/diagnostics?screen=middle`

## 5. Roadmap Recomendado

- **FASE 0: Congelación, safepoint y diagnóstico.** 
  Asegurar el estado actual antes de tocar dependencias o integración de contenido.
- **FASE 1: Validación local del player y dashboard.** 
  Correr ambos en ventanas separadas usando `simulation` transport para revisar UX/UI.
- **FASE 2: Validación C2 real.** 
  Asegurar que Firebase en Vercel funciona de extremo a extremo sin latencia notable.
- **FASE 3: Preparación BrightSign / hardware.** 
  Cargar la URL estática en el BrightSign local de prueba para validar renderizado y conectividad webSocket en su red. Validar aceleración hardware.
- **FASE 4: Integración de CMS (Datos Reales).**
  Sustituir `mockCampaigns` por fetcher dinámico.
- **FASE 5: Piloto real en escaparate DELAGALA.**
  Prueba 24h en entorno físico.

---
*Fin de la auditoría.*
