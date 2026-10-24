---
name: hyperframes-video
description: Produce el video final (MP4) de un reel usando HyperFrames (framework de HeyGen, HTML/CSS/GSAP/FFmpeg) en vez de Remotion — el camino que corresponde cuando el pedido o el brief piden HyperFrames explícitamente, o cuando `video`/`ai-reel` preguntan la tecnología y se elige esta. Usalo para "armá el reel en HyperFrames", "renderizá con HyperFrames" o cuando el brief.md de un reel diga `producción en HyperFrames` en vez de Remotion.
---

# hyperframes-video

> **Nota (2026-10-24, agregada por Claude, no por el autor de este skill):** este archivo describe el toolchain
> de otro proyecto (`clients/<cliente>/assets/reels/<slug>/`, el CLI `hyperframes`, `tools/render-hyperframes.mjs`)
> — ninguno de los dos existe en `deph-baseline`. Si estás trabajando en una pieza de deph y necesitás un short/reel
> en HyperFrames, usá el skill `deph-shorts` (`.claude/skills/deph-shorts/SKILL.md`) en su lugar: layout, convenciones
> y herramientas (`tools/shorts/`) propias de este repo. Este archivo queda intacto por si corresponde a otro
> proyecto — no se reescribió su cuerpo.

> **Regla de oro (ver `CLAUDE.md`):** hacé únicamente lo que se te pidió. No agregues, quites, reemplaces ni rediseñes nada por tu cuenta (estilos, audio, textos, archivos, nombres, estructura). Al modificar algo existente se cambia solo lo pedido y se conserva todo lo demás. **Jamás rompas algo que ya funcionaba.** Si algo debería cambiar, se propone y se espera el OK.

Es el camino equivalente a `video`/`custom-reel`, pero con **HyperFrames** en vez de Remotion: composición en HTML/CSS puro animada con GSAP, renderizada a MP4 por el CLI `hyperframes` (FFmpeg por dentro). Se elige por reel, no por cliente: un mismo cliente puede tener reels en Remotion y otros en HyperFrames.

**Cuándo HyperFrames y cuándo Remotion** — preguntalo si no está ya decidido en el brief:
- **HyperFrames**: piezas con capas de texto/forma independientes que se animan por separado (precios, cápsulas, badges, grillas de producto) y no necesitan video real compuesto (clips de Flow, overlays de voz sincronizados). Más simple y liviano para esto.
- **Remotion**: reels con clips de video reales (Flow, filmado), voz en off con `av-sync`, subtítulos por palabra, o que ya tienen precedente en Remotion para ese cliente. Ver `video`/`custom-reel`/`ai-reel`.

Referencia completa del framework (CLI, anatomía de una composición, reglas de lint): `~/Projects/media-forge/docs/HYPERFRAMES_PLAYBOOK.md`.

## Dónde vive cada cosa en el asset

```text
clients/<cliente>/assets/reels/<slug>/
├── brief.md
├── source/              ← Insumos originales (fotos, audio) — fuente de verdad (ej. source/images/cutout.py)
├── hyperframes/
│   ├── index.html       ← Composición (HTML + CSS + GSAP), 100% del asset — análogo a remotion/Reel.tsx
│   └── <recursos>/      ← Copia local de las fotos/imágenes que usa el HTML (ver nota abajo)
└── final/                ← Entregable generado (<slug>.mp4)
```

`hyperframes/.build/` (generado por el render, gitignorado) es la build autocontenida: nunca se edita ni se versiona.

**Imágenes del asset: copialas dentro de `hyperframes/`, nunca `src="../source/..."`.** HyperFrames bloquea `../` fuera de la carpeta no solo en `check`/`render`, sino también en el preview en vivo (`hyperframes preview`/Studio) — una ruta hacia `source/` carga bien en el MP4 final (el script de render la inlinea como data URI antes de que HyperFrames la vea) pero se ve **rota en Studio**, porque ahí HyperFrames sirve el HTML tal cual, sin pasar por el inliner. Si el origen (`source/images/...`) cambia, hay que volver a copiarlo a `hyperframes/`.

## Flujo de trabajo

1. **Storyboard / escenas primero.** Si el reel tiene más de una idea (un gancho + un contenido, por ejemplo), definí las escenas como **composiciones HyperFrames separadas** (un `index.html` por escena, o varias `<section class="clip" data-start data-duration">` dentro de una sola si conviven en el mismo frame) — igual que las escenas de `tools/video/src/scenes.tsx` en Remotion. No fuerces todo en un solo frame estático: un título a tamaño real casi nunca entra junto con una grilla de producto en la misma composición.

2. **Marca, siempre inyectada, nunca hardcodeada.** `hyperframes/index.html` usa la misma convención que las plantillas de `image`/`document`:
   - `<!-- bf:brand -->` en el `<head>` (ahí se inyectan `@font-face` y las variables `--color-<token>` de `DESIGN.md` y `--bf-font-display`/`--bf-font-body`/`--bf-*` de `production.yaml`, como data URI).
   - `{{brand.logo}}` para el logo del contexto `video` (`production.yaml → video.logo`), `{{brand.name}}` para el `alt`.
   - CSS: `var(--color-bosque)`, `var(--bf-font-display)`, etc. — nunca un hex a mano. Si falta un token, se agrega a `DESIGN.md`, no se hardcodea acá.
   - Imágenes propias del asset (fotos de producto, etc.): rutas relativas normales a `../source/...`. El script de render las inlinea como data URI — no hace falta copiarlas a una carpeta de "assets" aparte.

3. **Estructura real de HyperFrames**, no placeholder genérico:
   - `#root` con `data-composition-id="<slug-del-asset>"` (la convención de nombres de `custom-reel` aplica igual: el id es el slug, nunca "proto", "v2" ni "Reel").
   - Cada escena, un `<section class="clip" data-start="..." data-duration="...">`.
   - Timeline GSAP **siempre** `gsap.timeline({ paused: true })`, registrado en `window.__timelines[<composition-id>]`.
   - **Nunca** `transform` por CSS en un elemento que GSAP también anima (`scale`, `rotate`, `x`, `y`): GSAP reescribe `style.transform` entero y pisa cualquier `transform` puesto por CSS (por ejemplo `translateX(-50%)` para centrar). Centrá con flexbox/grid o `left/right/margin`, no con `transform`.
   - **No animes `visibility`/`autoAlpha` sobre `.clip`**: HyperFrames ya gestiona la visibilidad del clip por `data-start`/`data-duration`. Animá los elementos hijos.

4. **Todo el contenido legible desde el frame 0** (regla fija de este cliente, puede no aplicar a todos — confirmar con el brief si no está dicho): en un reel de catálogo o con poco tiempo para leer, nada arranca en `autoAlpha`/`opacity: 0`. El movimiento es un asentamiento o un pulso sutil sobre contenido que ya se puede leer, nunca una entrada desde la nada. Si el pedido es un hook-y-corte más cinematográfico, esto puede no aplicar — preguntá.

5. **Zona segura real** (no la de `custom-reel`/Remotion — son fórmulas distintas, no mezclar): para una pieza de catálogo/estática, 65px de margen parejo en los 4 lados suele alcanzar; para un reel con voz o pensado como video nativo de Instagram, usá la fórmula real de este proyecto — `tools/video/src/types.ts → safeZone`: arriba 14% (~269px sobre 1920), abajo 35% (~672px, reservado para subtítulos/UI), costados 6% (~65px). `hyperframes check` mide overflow y oclusión real contra el lienzo — correlo, no calcules a ojo.

6. **Control previo con el CLI**, antes de dar nada por bueno:
   ```bash
   node tools/render-hyperframes.mjs clients/<cliente>/assets/reels/<slug> --check-only
   ```
   Lee los errores y warnings — `canvas_overflow`, `panel_out_of_canvas`, `text_occluded`, `content_overlap`, `overlapping_gsap_tweens` son reales, no ruido (salvo el caso documentado de selectores indexados en loop, ver nota abajo). Corregí antes de renderizar.

7. **Render final:**
   ```bash
   node tools/render-hyperframes.mjs clients/<cliente>/assets/reels/<slug>
   ```
   Sale `final/<slug>.mp4`.

   **Para mirarlo en vivo con Studio (play/scrub), abrilo sobre la build, no sobre la fuente.** El HTML fuente (`hyperframes/index.html`) usa `var(--color-*)` y `{{brand.*}}` sin resolver — Studio lo abre tal cual, sin pasar por `render-hyperframes.mjs`, así que las cápsulas de nombre/precio (fondo `var(--color-fondo)`) quedan transparentes y lo que está detrás (la botella) se filtra a través del texto. No es un bug de la pieza, es que faltaba la marca: `node tools/render-hyperframes.mjs <asset> --check-only` ya deja la build lista en `hyperframes/.build/` con todo resuelto — abrí Studio ahí:
   ```bash
   cd clients/<cliente>/assets/reels/<slug>/hyperframes/.build && npx hyperframes preview
   ```
   Studio editando sobre `.build/` no sirve para guardar cambios (se borra en el próximo render): es solo para mirar. Para editar, se edita `hyperframes/index.html` (la fuente) y se corre `render-hyperframes.mjs` de nuevo para ver el resultado con marca.

8. **Verificación de frames**, igual que `video`: sacá 2-3 cuadros del MP4 final con `ffmpeg -i final/<slug>.mp4 -vf "select='eq(n\,N)'" -fps_mode vfr cuadro.png` y miralos — logo, texto, zona segura, nada cortado.

## Nota sobre `overlapping_gsap_tweens` con selectores indexados

Si animás varios elementos del mismo tipo en un loop (`document.querySelectorAll('.item-x')[i]`), el linter estático de `hyperframes check` puede reportar falsos positivos de solapamiento porque no resuelve el índice dinámico — agrupa todo bajo el selector literal. Es ruido conocido mientras el elemento realmente animado en cada tween sea distinto (verificalo leyendo el código, no asumas). No cambia el resultado visual; `immediateRender: false` en los tweens no-primeros de ese selector reduce el ruido pero no lo elimina del todo.

## Cierre (común a los skills de producción)

1. `final/<slug>.mp4` es el entregable.
2. `node tools/asset.mjs status <asset> en-revision`
3. Corré `brand-review` sobre cuadros del video (texto, marca, zona segura).
4. Corré `node tools/check.mjs`.
5. Sugerí `social-copy` para el caption de la publicación.
6. Hacé commit con `<cliente>: reel <slug> (HyperFrames)`.
