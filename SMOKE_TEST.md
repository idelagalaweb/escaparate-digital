# Guía de Validación MVP (PASO 2)

Antes de conectar el BrightSign real, realizaremos un "Smoke Test" usando dos pestañas de tu navegador. Esto validará que el Dashboard, el CommandBus y Firebase están perfectamente sincronizados.

## Preparación
1. Asegúrate de que el despliegue en Vercel/Netlify ha terminado.
2. Configura las variables de entorno (`VITE_...`) en el dashboard del hosting.
3. Asegúrate de que `VITE_C2_TRANSPORT` esté establecido en `firebase`.

## Ejecución del Test

### 1. Inicialización de Identidades
- **Pestaña A (Control):** Abre `https://tu-app.vercel.app/dashboard`
- **Pestaña B (Player):** Abre `https://tu-app.vercel.app/player?screen=top`

### 2. Verificación de Heartbeat
- En la **Pestaña A (Dashboard)**, observa la sección "Estado Dispositivos".
- El indicador de **TV-SUPERIOR** debe pasar de rojo a **VERDE (ONLINE)** en menos de 5 segundos.
- Verifica que el tiempo de "LATENCY" se actualice cada pocos segundos.

### 3. Prueba de Comando PAUSE
- En el Dashboard, pulsa el botón **PAUSAR TODO** (o pausa individualmente la TV Superior).
- **En la Pestaña A:** Debes ver que el estado del comando pasa a `RECEIVED` y luego a `COMPLETED`.
- **En la Pestaña B:** La animación de los inmuebles debe detenerse instantáneamente.

### 4. Prueba de Comando RESUME
- En el Dashboard, pulsa **REANUDAR TODO**.
- **En la Pestaña A:** El estado debe volver a marcar `COMPLETED` (nuevo ID).
- **En la Pestaña B:** La reproducción debe continuar su ciclo normal.

### 5. Prueba de Persistencia (Simulación de Reinicio)
- Recarga la **Pestaña B** (el player).
- Observa que el player arranca inmediatamente con el último estado conocido (si estaba pausado, debe seguir pausado) sin esperar a que el Dashboard envíe nada. Esto valida el **Fast Boot Cache**.

---

**¿Todo en orden?** Si los 5 puntos han funcionado, la arquitectura C2 es sólida. ¡Es hora de ir al BrightSign! (PASO 3)
