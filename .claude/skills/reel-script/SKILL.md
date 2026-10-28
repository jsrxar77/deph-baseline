---
name: reel-script
description: Escribe el guion de un reel o TikTok en el tono del cliente. Incluye un gancho que resuelve en los primeros 3 segundos, desarrollo, llamado a la acción, texto en pantalla, voz en off, duración por escena y audio sugerido. Usalo después de brief para cualquier video vertical corto, o cuando pidan "guion", "idea de reel" o "qué digo en el video".
---

# reel-script

> **Regla de oro (ver `CLAUDE.md`):** hacé únicamente lo que se te pidió. No agregues, quites, reemplaces ni rediseñes nada por tu cuenta (estilos, audio, textos, archivos, nombres, estructura). Al modificar algo existente se cambia solo lo pedido y se conserva todo lo demás. **Jamás rompas algo que ya funcionaba.** Si algo debería cambiar, se propone y se espera el OK.

Escribe `script.md` en la carpeta del asset, a partir de `templates/script.md`.

## Inicio (común a los skills de producción)

1. **Cliente activo.** Sale del `brief.md` del asset (`client`). Si no hay asset, corré `brief` primero. Si no está claro el cliente, preguntá.
2. **Ficha.** Leé `clients/<cliente>/PRODUCT.md`, `DESIGN.md`, `brand/brand-guide.md` y `brand/production.yaml`. Si `issuer_brand` es otra marca, leé también su ficha: la emisora manda en lo visual y el destino en el contenido.
3. **Ejemplos.** Revisá `brand-guide.md → Ejemplos aprobados` y los reels `aprobado` o `publicado` de `assets/INDEX.md`. Leé sus `script.md` para calibrar ritmo y voz.
4. **Especializados.** Si el `CLAUDE.md` del cliente lista un skill `/<cliente>--...` para este formato (una serie fija, por ejemplo), seguilo: manda sobre este.
5. **Ángulo.** Leé `angle` del `brief.md`. Si está vacío o no existe, corré `content-angles` antes de escribir: no se arranca sin ángulo. El gancho de los primeros 3 segundos y la estructura de escenas salen de él, y los dos ganchos alternativos son variantes del mismo ángulo. Anotalo en el encabezado de `script.md`.

## Cómo escribirlo

- **Gancho (0–3 s).** Tiene que resolver solo, sin sonido: el texto en pantalla carga la idea aunque la voz no se escuche. Usá los tipos de gancho que `brand-guide.md → Estilo para video y redes` dice que funcionan. Evitá arrancar con saludos, presentaciones o el logo.
- **Una idea por escena**, de 2 a 5 s. La duración total la fija el brief. Si no la fija, apuntá a 15–30 s.
- **Texto en pantalla ≤ 7 palabras por escena.** Complementa a la voz, no la transcribe. Marcá con `*palabra*` la palabra de énfasis: el video la pinta con el color de acento.
- **Voz en off con frases cortas**, que se lean en voz alta sin trabarse. Calculá unas 2,5 palabras por segundo. La suma de palabras tiene que entrar en la duración.
- **Llamado a la acción concreto** y alineado con el objetivo del brief (guardar, comentar una palabra, escribir por WhatsApp, link en la bio).
- **Audio sugerido.** Usá el tipo de música y la referencia de `brand-guide.md`. Si el reel tiene voz, la música va como cama baja.
- **Voz del cliente.** Respetá las palabras sí y no, la persona gramatical y los ejemplos. **No inventes datos, precios ni testimonios**: solo lo que está en `PRODUCT.md → Evidence on Hand` o en el brief.
- Proponé **dos ganchos alternativos** debajo de la tabla para que el usuario elija.

## Qué dejar en la carpeta del asset

- `script.md` con la tabla de escenas, la **voz en off corrida** (el texto exacto que se graba) y un borrador de caption.
- Si hay voz en off, `source/voiceover.txt` con el mismo texto corrido y sin marcas. Lo usan `tools/voiceover.mjs` y `tools/transcribe.mjs`.

## Cierre (común a los skills de producción)

1. Guardá todo dentro de la carpeta del asset.
2. `node tools/asset.mjs status <asset> en-revision`
3. Corré `brand-review` sobre el guion. Si pide cambios, corregí y repetí. Un guion aprobado queda `en-revision` hasta que el video esté terminado: el asset es el reel, no el guion. Anotá en el Historial del brief `guion aprobado`.
4. Corré `node tools/check.mjs`.
5. El siguiente paso es `storyboard`.
