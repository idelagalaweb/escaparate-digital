# Guía de Despliegue y Sincronización BrightSign

Este documento detalla cómo configurar y validar la sincronización de los reproductores BrightSign para el proyecto InmoIA Escaparate.

## 1. URLs de Configuración
Cada reproductor debe configurarse en BA Connected mediante un widget HTML5 apuntando a su URL específica:

*   **TV SUPERIOR:** `http://[IP_DEL_SERVIDOR]/?screen=top`
*   **TV CENTRAL:** `http://[IP_DEL_SERVIDOR]/?screen=middle`
*   **TV INFERIOR:** `http://[IP_DEL_SERVIDOR]/?screen=bottom`

## 2. Herramientas de Diagnóstico
Para validar la salud técnica de un reproductor, carga la siguiente URL (puedes hacerlo desde un navegador en la misma red):
*   `http://[IP_DEL_SERVIDOR]/diagnostics?screen=[top|middle|bottom]`

### Qué revisar en Diagnósticos:
1.  **UTC_TIMESTAMP:** Debe ser idéntico en los 3 reproductores (margen < 500ms).
2.  **NORMALIZED_MADRID:** Debe mostrar la hora de Madrid correcta, incluso si el BrightSign dice estar en Los Ángeles.
3.  **ACTIVE_ITEM:** Confirma que el ID del contenido coincide con lo esperado por el orquestador.

## 3. Resolución de Problemas de Sincronización
Si las pantallas no cambian de contenido al mismo tiempo:

1.  **Problema de Zona Horaria:** El sistema está diseñado para ignorar la zona horaria del dispositivo y usar UTC. Si la hora de Madrid es incorrecta, revisa la conexión a internet para que el navegador pueda sincronizar su reloj base.
2.  **Desfase Visual:** Si una pantalla va retrasada, comprueba el **Hardware Acceleration** en la configuración del widget HTML5 de BA Connected.
3.  **Hora del Sistema:** Aunque usamos UTC, si el reloj interno del BrightSign está desviado por años/meses, el certificado SSL (si usas HTTPS) fallará. Asegúrate de tener configurado un servidor NTP en el BrightSign.

## 4. Modo de Depuración (Sync Debug)
Desde el Dashboard principal de la aplicación, puedes ver la sección **Sync Debug (Live)** que muestra el pulso UTC que está alimentando a los orquestadores de cada pantalla.

---
*Desarrollado por Antigravity para InmoIA360*
