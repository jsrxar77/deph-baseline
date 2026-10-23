# Guía Paso a Paso: Conectar `deph` con tu Canal de YouTube (OAuth 2.0 Gratis)

Esta guía está escrita paso a paso (sin asumir conocimientos previos de Google Cloud) para conectar el script `tools/youtube/publish.mjs` con tu canal de YouTube (**deph — generative ambient**, `UC1cFX0dl77im5F5V-RRi6hA`).

Solo necesitas hacer esta configuración **una única vez** (toma unos 4 minutos).

---

## Paso 1: Crear un proyecto en Google Cloud Console

1. Abre en tu navegador [https://console.cloud.google.com/](https://console.cloud.google.com/) e inicia sesión con la cuenta de Google dueña de tu canal de YouTube.
2. Arriba a la izquierda (al lado del logo de Google Cloud), haz clic en el selector de proyectos y pulsa **"Proyecto nuevo" (New Project)**.
3. En **Nombre del proyecto**, escribe: `deph-youtube` y haz clic en **Crear**.
4. Asegúrate de que `deph-youtube` quede seleccionado arriba a la izquierda.

---

## Paso 2: Activar la API de YouTube (YouTube Data API v3)

1. En el menú izquierdo (o en el buscador de arriba), entra en **APIs y servicios > Biblioteca** (*APIs & Services > Library*).
2. Busca **`YouTube Data API v3`**.
3. Haz clic en el resultado **YouTube Data API v3** y pulsa el botón azul **Habilitar (Enable)**.

---

## Paso 3: Configurar la Pantalla de Consentimiento OAuth

1. En el menú izquierdo, ve a **APIs y servicios > Pantalla de consentimiento de OAuth** (*OAuth consent screen* o *Google Auth Platform*).
2. Si te pregunta tipo de usuario, elige **Externo (External)** y pulsa **Crear**.
3. Completa solo los 3 campos obligatorios:
   * **Nombre de la aplicación:** `deph uploader`
   * **Correo electrónico de asistencia del usuario:** selecciona tu propio email.
   * **Información de contacto del desarrollador (abajo del todo):** escribe tu propio email.
4. Haz clic en **Guardar y continuar** en "Permisos (Scopes)" sin cambiar nada.
5. **MUY IMPORTANTE — Usuarios de prueba (Test users):**
   * En el paso **Usuarios de prueba (Test users)** (o en el menú lateral **Público / Audience**), haz clic en **"+ Add Users" (Añadir usuarios)**.
   * Escribe el correo de Google con el que manejas tu canal de YouTube y guarda. *(Como la app está en modo de prueba personal, solo tú podrás autorizarla y no necesitas pasar por ninguna revisión de Google).*

---

## Paso 4: Descargar el archivo `client_secret.json`

1. En el menú izquierdo, ve a **APIs y servicios > Credenciales** (*Credentials*).
2. Arriba del todo, haz clic en **"+ Crear credenciales" (+ Create Credentials)** $\rightarrow$ **ID de cliente de OAuth (OAuth client ID)**.
3. En **Tipo de aplicación (Application type)**, selecciona **Aplicación de escritorio (Desktop app)**.
4. En **Nombre**, deja `deph CLI` y pulsa **Crear**.
5. Se abrirá una ventana con un botón que dice **Descargar JSON (Download JSON)**. Haz clic ahí.
6. Mueve ese archivo descargado a la carpeta de credenciales del proyecto con este nombre exacto:
   ```
   /Users/javier/Projects/deph-baseline/tools/youtube/.credentials/client_secret.json
   ```
   *(Esa carpeta `.credentials/` está en `.gitignore`, por lo que nunca se subirá a GitHub).*

---

## Paso 5: Autorizar tu canal desde la terminal (1 sola vez)

Desde la raíz del proyecto (`/Users/javier/Projects/deph-baseline`), corre:

```bash
node tools/youtube/auth.mjs
```

1. Se abrirá tu navegador automáticamente.
2. Elige tu cuenta y, si aparece tu canal **deph**, selecciónalo.
3. Si Google muestra un aviso de *"Google no ha verificado esta aplicación"*, haz clic en **Configuración avanzada (Advanced)** $\rightarrow$ **Ir a deph uploader (no seguro)** (es tu propia aplicación local) y marca las casillas de permiso.
4. Verás la pantalla oscura de confirmación **`deph · YOUTUBE CONECTADO`** y en la terminal aparecerá:
   `✓ Canal verificado: "deph..."`

---

## Uso diario para subir videos y Shorts

### 1. Probar y verificar el paquete sin subir nada (`--dry-run`)
No requiere siquiera haber conectado OAuth todavía; revisa títulos EN/ES, longitudes, capítulos, etiquetas, portada y reglas de honestidad:

```bash
node tools/youtube/publish.mjs musica-universalis --dry-run
node tools/youtube/publish.mjs slow-drift --dry-run
node tools/youtube/publish.mjs the-field --dry-run
```

### 2. Subir una obra en modo Privado (por defecto, seguro)
Sube el `.mp4` 4K, configura inglés como idioma base, carga la traducción en español automáticamente, sube la portada `.jpg` y lo agrega a la playlist `deph — generative ambient`:

```bash
node tools/youtube/publish.mjs musica-universalis
```

### 3. Subir directamente como Público o Programado
```bash
# Público directo (también publica el comentario de enganche en el video):
node tools/youtube/publish.mjs musica-universalis --privacy=public

# Programado para una fecha/hora exacta (ISO 8601):
node tools/youtube/publish.mjs musica-universalis --publish-at=2026-10-25T20:00:00Z
```
