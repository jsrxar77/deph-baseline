---
name: captions
description: Genera los subtítulos de un reel o video a partir de la voz en off. Transcribe con whisper y obtiene tiempos por palabra; corrige la ortografía contra el guion y escribe captions.json (para el render) y captions.srt (para subir a redes). Usalo desde el skill video, o cuando pidan "subtítulos", "captions del video" o "SRT".
---

# captions

> **Regla de oro (ver `CLAUDE.md`):** hacé únicamente lo que se te pidió. No agregues, quites, reemplaces ni rediseñes nada por tu cuenta (estilos, audio, textos, archivos, nombres, estructura). Al modificar algo existente se cambia solo lo pedido y se conserva todo lo demás. **Jamás rompas algo que ya funcionaba.** Si algo debería cambiar, se propone y se espera el OK.

## Inicio (común a los skills de producción)

1. **Cliente activo.** Sale del `brief.md` del asset. Si no está claro, preguntá.
2. **Ficha.** Leé `brand/brand-guide.md → Estilo para video y redes → Subtítulos` y `brand/production.yaml → video.captions`: posición, mayúsculas, tamaño, caja y agrupado.
3. **Especializados.** Si hay un skill `/<cliente>--...` que cambia los subtítulos, seguilo.
4. Tiene que existir `source/voiceover.wav`. Si no existe, generalo con el paso 1 del skill `video`.

## Pasos

1. Transcribí:
   ```sh
   node tools/transcribe.mjs <asset>/source/voiceover.wav --script <asset>/source/voiceover.txt
   ```
   `--script` corrige las tildes y mayúsculas que whisper pierde. La primera vez compila whisper.cpp y baja el modelo, lo que tarda unos minutos.
2. **Revisá la transcripción** que imprime el script contra `voiceover.txt`. Si una palabra salió mal, corregí el `text` en `source/captions.json` a mano, sin tocar los tiempos. Revisá especialmente nombres propios, marcas, cifras y siglas.
3. Si el estilo del cliente pide otro agrupado (páginas más cortas o más largas), ajustá `video.captions.combineMs` en `production.yaml`. Eso es un cambio de ficha: avisale al usuario.
4. Copiá `source/captions.srt` a `final/` cuando el video esté aprobado.

## Cierre

Este skill forma parte del flujo de `video`, así que no cambia el estado del asset por su cuenta. Los subtítulos se revisan con el video en `brand-review`: sincronización, ortografía y estilo. Si se usa suelto, anotá en el Historial del brief `subtítulos generados`.
