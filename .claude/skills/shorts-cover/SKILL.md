---
name: shorts-cover
description: Reglas y especificaciones milimétricas para generar portadas verticales nativas (1080x1920, 9:16) de YouTube Shorts en deph, replicando con exactitud matemática el diseño editorial de The Field (Obra 03).
---

# shorts-cover — Especificación de Portadas Verticales (YouTube Shorts 9:16)

Esta guía define el estándar visual canónico para las portadas nativas de YouTube Shorts (1080x1920) de **deph**, basado en la ingeniería inversa exacta de la portada original de **The Field** (`the-field-short-01-en-cover-9x16.jpg` y `the-field-short-01-es-cover-9x16.jpg`).

---

## 🛑 Reglas de Oro Inviolables (Anti-Patrones Prohibidos)

1. **PROHIBIDO ABSOLUTO EL BORDE EN EL CARD (0px Stroke)**:
   * El card central **NO LLEVA BORDE**. Prohibido trazar contornos de 1px o 2px con colores violeta, cian o blanco que parezcan ventanas de Paint.
   * La separación con el fondo se logra exclusivamente mediante el color de fondo índigo oscuro translúcido y una **sombra difusa profunda** (`box-shadow: 0 20px 60px rgba(0, 0, 0, 0.70)`).
2. **PROHIBIDO EL ESPACIO MUERTO (Card Compacto y Proporcionado)**:
   * La altura del card central es de **420px** (desde `Y: 740px` hasta `Y: 1160px`). Prohibido inflar la tarjeta a 600px o dejar áreas desiertas de color negro arriba o abajo del texto.
3. **PROHIBIDO EL TEXTO DIMINUTO**:
   * El titular (Hook) debe ser dominante, en negrita pesada (peso 900), con tamaño entre **56px y 62px** e interlineado compacto (`line-height: 1.15`), llenando armónicamente el ancho interno del card (de 800px a 820px de ancho útil).
4. **PROHIBIDO EL BOTÓN ROJO DE SUSCRIPCIÓN EN LA PORTADA**:
   * La portada es una carátula editorial estática, no un fotograma de video con botones interactivos de YouTube (`SUSCRIBIRSE`).
5. **PROHIBIDO SUBTÍTULOS O DIÁLOGOS DE VOZ**:
   * El fondo debe extraerse de un fotograma puro de la obra sin karaoke, subtítulos dinámicos ni barras de reproducción.
6. **PROHIBIDO EL LETTERBOXING O BANDAS LATERALES BORROSAS (16:9 Padded)**:
   * El lienzo es **1080x1920 nativo** a pantalla completa vertical.

---

## 📐 Anatomía y Coordenadas Exactas (Lienzo: 1080 x 1920)

La composición consta de **3 elementos balanceados verticalmente**:

```
[ Canvas: 1080 x 1920 ]

       ┌────────────────────────┐
       │   (◎)  DEPH · XX       │   <- 1. Píldora Superior (Serie)
       └────────────────────────┘      Y: 220px a 295px (Alto: 75px)
                 │
                 │ (~445px de distancia vertical libre)
                 ▼
 ┌────────────────────────────────────────┐
 │          • CATEGORÍA · 432 HZ          │   <- 2. Card Central (Hook Editorial)
 │                                        │      • Ancho: 920px (X: 80 a 1000)
 │          TITULAR ENORME DEL            │      • Alto: 420px (Y: 740 a 1160)
 │           GANCHO EDITORIAL             │      • CERO BORDE (0px stroke)
 │               ──────                   │      • Sombra difusa: 0 20px 60px
 │         SUBTÍTULO / RESONANCIA         │      • Esquinas: border-radius 24px
 └────────────────────────────────────────┘
                 │
                 │ (~160px de distancia vertical libre)
                 ▼
       ┌────────────────────────┐
       │ 🎧 AURICULARES · AMB...│   <- 3. Píldora Inferior (Audio Cue)
       └────────────────────────┘      Y: 1320px a 1405px (Alto: 85px)
```

---

### 1. Píldora Superior (Marca / Serie)
* **Posición**: Centrada horizontalmente (`X: 300px` a `780px`, ancho ~480px o fit-content ~320px), vertical: `Y: 220px` a `295px` (Alto: 75px).
* **Fondo**: Cápsula oscura translúcida (`rgba(11, 14, 26, 0.75)`), `border-radius: 38px`.
* **Glifo de Marca**: 4 anillos concéntricos en cian (`#7FD4F5`, opacidad decreciente exterior).
* **Texto**: `DEPH · {NÚMERO_DE_OBRA}` (ej. `DEPH · 03`, `DEPH · 04`).
  * Tipografía: Sans-serif, peso 600, tamaño ~28px, tracking `0.18em`, color `#FFFFFF`.

---

### 2. Card Central (Hook Editorial)
* **Geometría**:
  * Ancho: **`920px`** (centrado horizontal, `X: 80px` a `1000px`).
  * Alto: **`420px`** (centrado vertical óptimo para móviles, `Y: 740px` a `1160px`).
  * Esquinas: `border-radius: 24px`.
  * **Borde**: **`0px (Sin trazo ni borde)`**.
  * Relleno: Azul índigo oscuro profundo `rgba(16, 28, 70, 0.88)` (o gradiente `linear-gradient(135deg, rgba(20, 36, 90, 0.88), rgba(10, 18, 55, 0.92))`).
  * Sombra: `box-shadow: 0 20px 60px rgba(0, 0, 0, 0.70)`.

* **Estructura Interna**:
  1. **Badge Superior (Categoría)**:
     * Posición vertical: `Y: ~775px`.
     * Bullet (punto): `#D946EF` (magenta brillante).
     * Texto: `• {TEMA} · 432 HZ` (ej. `• CIMÁTICA · 432 HZ`, `• GEOMETRÍA SAGRADA · 432 HZ`).
     * Tipografía: Lila / púrpura claro (`#C084FC`), mayúsculas, peso 700, tracking `0.16em`, tamaño `22px - 24px`.
  2. **Título del Gancho (Hook Title)**:
     * Posición vertical: `Y: ~820px` a `950px`.
     * Tipografía: Sans-serif geométrica (Avenir Next, Montserrat, Inter), **peso 900 (Black / Heavy)**.
     * Tamaño: **`56px - 62px`**.
     * Color: Blanco puro `#FFFFFF` con `text-shadow: 0 4px 20px rgba(0, 0, 0, 0.85)`.
     * Interlineado: **Compacto (`line-height: 1.15`)**.
     * Ocupa de 1 a 2 líneas, abarcando ~800px de ancho útil.
  3. **Línea Divisoria**:
     * Posición vertical: `Y: ~970px` (centrada).
     * Ancho: **`120px`**, Grosor: **`3px`**, bordes redondeados (`radius: 1.5px`).
     * Color: Gradiente horizontal de cian a violeta (`linear-gradient(90deg, #38BDF8, #C084FC)`).
  4. **Subtítulo Inferior**:
     * Posición vertical: `Y: ~1005px`.
     * Tipografía: Sans-serif, peso 700 bold, tamaño `24px - 26px`, tracking `0.12em`.
     * Color: Cian brillante (`#38BDF8`).

---

### 3. Píldora Inferior (Cue de Audio)
* **Posición**: Centrada horizontalmente (`X: 280px` a `800px`), `Y: 1320px` a `1405px` (Alto: 85px).
* **Fondo**: Cápsula oscura muy sutil (`rgba(11, 14, 26, 0.65)`), `border-radius: 42px`.
* **Icono**: Auriculares (🎧) en cian `#7FD4F5`.
* **Texto**:
  * EN: `HEADPHONES · GENERATIVE AMBIENT`
  * ES: `AURICULARES · AMBIENTE GENERATIVO`
* **Tipografía**: Sans-serif, peso 600, tamaño ~22px, tracking `0.18em`, color cian suave / blanco nacarado.

---

## 💎 Glassmorphism Auténtico (Frosted Glass & Difusión)

El glassmorphism **NO ES un rectángulo con color plano semitransparente**. Exige recrear el comportamiento óptico de un cristal esmerilado real sobre el metraje:

1. **Backdrop Blur (Difusión del Fondo)**:
   * Se recorta la porción exacta del fondo que se ubica detrás del panel (con un padding de seguridad de 35px para evitar bordes oscuros).
   * Se aplica un **Gaussian Blur de 32px** (`ImageFilter.GaussianBlur(32)` o `backdrop-filter: blur(32px)`).
   * Se potencia la saturación de los colores del fondo desenfocado a un 180% (`ImageEnhance.Color.enhance(1.8)` o `saturate(180%)`) para que el brillo de las geometrías y luces subyacentes vibren a través del vidrio.
2. **Tinte Índigo Translúcido**:
   * Sobre el fondo desenfocado se funde un degradado azul índigo profundo (`rgba(14, 24, 64, 0.55)` a `rgba(10, 16, 48, 0.70)`), permitiendo que la energía del metraje se trasluzca de forma orgánica.
3. **Brillo Especular (Glass Sheen)**:
   * Los primeros 100px a 120px superiores del panel llevan un reflejo de luz blanca hiper-sutil (`rgba(255, 255, 255, 0.10)` decreciendo a `0.0`), simulando el ángulo de incidencia de la luz sobre el cristal.
4. **Sombra Ambiental Profunda**:
   * Sombra difusa multicapa bajo el card (`offset y=16px`, `GaussianBlur(24px)`, opacidad `195`), proyectando el card hacia adelante en el espacio 3D.
5. **Máscara de Esquinas Suaves**:
   * Se recorta el panel con una máscara alfa de esquinas redondeadas (`radius: 24px` en el Card, `38px` en píldora superior, `42px` en píldora inferior) **sin ningún trazo perimetral (0px stroke)**.

---

## 🛠️ Script Canónico en Python (Generador Fiel al Píxel)

```python
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

def make_frosted_panel(base, box, radius, tint_rgb, alpha_range, blur_rad=32, sat=1.8):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    pad = blur_rad + 6
    
    # 1. Recorte con padding y desenfoque gausiano (difusión)
    crop_box = (max(0, x0 - pad), max(0, y0 - pad), min(base.width, x1 + pad), min(base.height, y1 + pad))
    patch = base.crop(crop_box).filter(ImageFilter.GaussianBlur(blur_rad))
    blurred = ImageEnhance.Color(patch).enhance(sat).crop((pad, pad, pad + w, pad + h))
    
    # 2. Tinte índigo translúcido
    tint = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    t_draw = ImageDraw.Draw(tint)
    a_start, a_end = alpha_range
    for y in range(h):
        t = y / h
        a = int(a_start * (1 - t) + a_end * t)
        t_draw.line([0, y, w, y], fill=(tint_rgb[0], tint_rgb[1], tint_rgb[2], a))
    
    # 3. Reflejo especular superior
    for y in range(min(120, h)):
        t = y / min(120, h)
        alpha = int(24 * (1.0 - t))
        t_draw.line([0, y, w, y], fill=(255, 255, 255, alpha))
    
    glass = Image.alpha_composite(blurred.convert("RGBA"), tint)
    
    # 4. Máscara redondeada sin borde
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w, h], radius=radius, fill=255)
    return glass, mask
```
