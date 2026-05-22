# BRIGHTSIGN HELLO WORLD TEST

Esta es una guía paso a paso para probar la comunicación remota en tiempo real (C2) entre el Dashboard Web y una pantalla reproductora física de BrightSign usando Firebase, sin depender de la carga de campañas pesadas ni lógica de CMS compleja.

## 1. Requisitos Previos (Variables de Entorno)

Asegúrate de que Vercel y tu entorno local cuentan con las variables reales de Firebase:

- `VITE_C2_TRANSPORT=firebase`
- `VITE_SITE_ID=delagala-escaparate-01`
- `VITE_FIREBASE_API_KEY=...`
- `VITE_FIREBASE_AUTH_DOMAIN=...`
- `VITE_FIREBASE_DATABASE_URL=...`
- `VITE_FIREBASE_PROJECT_ID=...`
- `VITE_FIREBASE_APP_ID=...`

## 2. Preparación de BrightSign (BrightAuthor:connected)

1. Abre BrightAuthor:connected y crea o abre tu presentación de red (Networked Presentation).
2. Arrastra a la zona de contenido un widget de tipo **HTML5 State**.
3. En la configuración del HTML5, marca la opción "URL" e introduce la siguiente URL exacta (sustituyendo `[TU_DOMINIO]` por tu despliegue de Vercel o túnel local, ej. ngrok):

   `https://[TU_DOMINIO]/?screen=top&debug=true`

   > **Nota:** El parámetro `debug=true` mostrará telemetría en tiempo real de Firebase y los comandos recibidos arriba a la izquierda.
   > El parámetro `screen=top` identifica a este BrightSign como la pantalla superior.

4. Publica la presentación en el BrightSign.

## 3. Emisión de la prueba (Dashboard)

1. Abre un navegador y accede al panel de control (Dashboard) entrando a la raíz:
   `https://[TU_DOMINIO]/`
2. En la barra superior derecha, asegúrate de que el indicador de conexión (WiFi icon) muestre un estado "CONNECTED" en verde y comprueba que el botón de SIMULACIÓN/REAL indique "REAL (C2)" en verde.
3. Localiza el panel nuevo titulado **PRUEBA HELLO WORLD C2** (color morado/índigo) en la columna izquierda.
4. Escribe un mensaje en la caja de texto (ej. "¡Hola desde Vercel!").
5. En el desplegable, selecciona **TV SUPERIOR (TOP)** o **TODAS LAS PANTALLAS (ALL)**.
6. Pulsa el botón **ENVIAR A PANTALLA**.

## 4. Resultado Esperado en la TV (BrightSign)

Inmediatamente tras pulsar el botón, en la televisión física deberías observar que:

1. El panel de Debug arriba a la izquierda registra `DISPLAY_MESSAGE` en la sección de "Último Recibido".
2. La pantalla se vuelve negra (`#09090b`).
3. Aparece tu mensaje gigante en texto blanco centrado en la pantalla.
4. Aparecen dos barras horizontales y el texto "ESCAPARATE C2 TEST" arriba del mensaje y la indicación de tu TARGET (ej: TOP) abajo.
5. *(Opcional)* Si conectaste un ratón al BrightSign o pruebas esto en un PC local, puedes hacer click en "Cerrar Mensaje (Test)" para ocultar la prueba y volver a la campaña regular en loop.

## 5. Solución de Problemas

- **Si el panel Debug del TV no muestra `ONLINE`**: Revisa si el BrightSign tiene acceso a internet y el reloj en hora (si está muy desfasado, fallan los certificados SSL de Firebase/Vercel).
- **Si dice `ONLINE` pero el mensaje no llega**: Asegúrate de que el `SITE_ID` y las credenciales de Firebase en el Dashboard son exactamente iguales a las que recibe el BrightSign al cargar su entorno de Vercel.
- **Si el mensaje sale cortado/feo**: Confirma que el TV está en resolución nativa y sin un *overscan* activo (ajuste de zoom de la tele). La app asume `100vw` y `100vh` limpios.
