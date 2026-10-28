---
name: ai-reel
description: Flujo completo, con reglas y puertas de aprobación, para producir reels y videos con personas generadas con IA (Google Flow), con voz real o narración y edición en Remotion. Ordena los demás skills (reel-script, storyboard, flow-video, av-sync, custom-reel, video, captions, brand-review) y fija cuándo hay que parar y preguntar antes de gastar créditos, tokens o trabajo. Usalo SIEMPRE que un reel o video lleve personas generadas con IA, o cuando pidan "armemos el reel con Flow", "generá los planos", "hagamos el video con personajes" o "cuál es el flujo para este tipo de video".
---

# ai-reel

> **Regla de oro (ver `CLAUDE.md`):** hacé únicamente lo que se te pidió. No agregues, quites, reemplaces ni rediseñes nada por tu cuenta (estilos, audio, textos, archivos, nombres, estructura). Al modificar algo existente se cambia solo lo pedido y se conserva todo lo demás. **Jamás rompas algo que ya funcionaba.** Si algo debería cambiar, se propone y se espera el OK.

> **OBJETIVO DE LA SCENE (regla de oro de Flow): la Scene existe para buscar la COHERENCIA entre las tomas** (mismo lugar, luz, cámara, vestuario y Characters). Todo lo que se hace con una Scene —armarla, agregar planos, generar con su prompt, recortar— se decide por esa pregunta: ¿esto hace que las tomas queden más coherentes entre sí? Si no, no se hace.

> **SIEMPRE LOS CHARACTERS DEFINIDOS (regla de oro, 2026-10-11):** todo clip nuevo que se genere con el prompt de la Scene lleva **adjuntos como ingredientes ("+" → Characters)** los Characters del elenco que aparecen en el plano (`KI-Cantante-Marcelo`, `KI-Amiga-Laura`, `KI-Amigo-Diego`, según `brand/cast.md`), y el prompt los nombra tal cual. Antes de enviar se verifica que cada Character del plano esté en las fichas (chips) del cuadro; nunca se genera con una persona descrita en texto, con una foto o sin Character. Si falta uno, no se envía.

> **REGLA DE ORO DE FLOW (2026-10-10, repetida muchas veces por la persona): todo video se hace DENTRO de una Scene de Flow, y todo clip nuevo se genera con EL PROMPT DE LA SCENE. Ningún plano se genera suelto.** La vista de una Scene (`/scene/<uuid>`) tiene abajo su propio cuadro de prompt ("Describe how to edit this video…", modelo Omni 1.1 Flash, "+" de ingredientes) y a la derecha el clip seleccionado con su prompt y sus Characters: **ese es el lugar donde se genera un clip nuevo**, partiendo del clip seleccionado y con los Characters de la Scene, y eso es lo que lo hace coherente. Un clip generado fuera de la Scene (composer del proyecto, `flow_generate` suelto) sale incoherente con el resto (otro cuarto, otra luz, otro plano) aunque use los mismos Characters, y los créditos se pierden. Orden obligatorio: (1) crear o abrir la Scene con los planos que ya van; (2) seleccionar el clip desde el que arranca el plano nuevo; (3) escribir el prompt **en el cuadro de la Scene**, con los Characters como ingredientes; (4) mostrar el plan con el costo y esperar el OK, y probar **un** clip adentro de la Scene antes de hacer más; (5) el clip nuevo se agrega a la Scene, se recorta ahí con los tiradores y la Scene se baja desde ahí. Documentación oficial: [Edit videos & build scenes](https://support.google.com/flow/answer/16935718) (Extend, Save frame). **Nunca se le pasa el trabajo a la persona** (prompts para que los pegue ella): lo hago yo con el MCP. Si el MCP todavía no puede generar con el prompt de la Scene, **primero se agrega esa función al MCP** (`tools/flow-mcp`) y recién después se genera. No se genera "mientras tanto".

> **Una Scene por LUGAR, con toda la secuencia adentro (regla de oro, 2026-10-11).** Si una escena transcurre en un cuarto, **todos los planos de esa secuencia viven en la misma Scene de Flow**: la Scene es la que "conoce" el cuarto (paredes, cuadros, lámparas, luz, ubicación de los muebles y de los Characters), y cada plano nuevo se genera adentro de ella para heredar eso. Un plano generado en otra Scene, o suelto, inventa otro cuarto. Por eso: (1) se define primero el reparto de lugares (un lugar = una Scene) y se usa **la misma Scene para todos los planos de ese lugar**, aunque cambie el tono o el momento del reel; (2) los planos que ya existen de ese lugar se agregan a esa Scene antes de generar nada; (3) un plano nuevo de ese lugar se genera con el prompt de esa Scene; (4) solo se abre una Scene nueva para un lugar nuevo. Partir una secuencia del mismo cuarto en Scenes distintas (por ejemplo "tono bajo" y "tono correcto") es el error que causó los clips incoherentes del 2026-10-10.

Orquesta la producción de un reel con personas generadas con IA. No reemplaza a los otros skills: define **el orden, las puertas de aprobación y las reglas**. Si un paso de este flujo choca con un skill específico, manda el skill específico (`flow-video`, `av-sync`).

## Reglas que valen en todas las fases

1. **Se pregunta antes de decidir lo que cuesta créditos, tokens o trabajo.** Una "puerta" es un mensaje con: qué voy a hacer, cuánto cuesta (créditos de Flow, tiempo), qué se pierde si sale mal. Se espera un "sí" explícito. Nunca se avanza "porque ya se había hablado".
2. **Todo con Characters de Flow, y completos.** Cada persona que aparece (protagonista y secundarios) es un Character con retrato, cuerpo, voz e información (`flow-cast`), referenciado como `asset:<nombre>`. Prohibido sustituirlo por fotos o descripciones, y prohibido un personaje a medias. Detalle en `flow-cast` y `flow-video`.
3. **Primero un plano de prueba.** Se genera uno, se baja, se mira y se aprueba; recién ahí el lote. Nunca un lote sin haber visto uno.
4. **Cada clip se mira antes de usarlo** (hoja de contactos): identidad, encuadre, texto o logos en pantalla, artefactos. No se usa un clip que no se vio.
5. **Se mide antes de editar** (`av-sync`): dónde entra y termina la voz, cuándo mueve la boca la persona. Nada de recortes a ojo.
6. **Si algo falla, se frena, se diagnostica y se avisa.** No se sustituye una herramienta en silencio y no se sigue "mientras tanto".
7. **Las notas se escriben en el momento** en el skill que corresponda, no al final.
8. **Qué hace cada herramienta (regla fija):** las **Scenes de Flow** sirven para que las partes del video se armen **coherentes entre sí** (mismo elenco, ropa, luz y continuidad), y nada más. Una vez armadas, **las Scenes y los clips se bajan y se quedan DENTRO del proyecto** (`source/videos/<versión>/scenes/` y `/clips/`, con `keyint=1`). **El armado y la edición final se hacen en Remotion**, con esos archivos locales. Flow no es el lugar del producto final.
9. **Cada fase se hace con su skill COMPLETO**, leído antes de producir: la plantilla, la ficha de voz, los datos reales, el cierre (`brand-review`, `review.md`, estado, historial del brief). No se reemplaza por una tabla o un formato propios. La narración se entrega **de corrido, en un solo texto** y también en `source/voiceover.txt`.
10. **Remotion Studio siempre encendido** desde que hay una composición del reel, para que la persona vea en vivo lo que pasa. Se enciende en segundo plano (`npx remotion studio index.tsx --port 3335` dentro de `remotion/` del asset), se comprueba que responde y se avisa la dirección (`http://localhost:3335`). Si se cae, se vuelve a encender antes de seguir. Detalle en `custom-reel`.
11. **Economía de tokens:** no consultar el avance cada pocos segundos (usar un monitor en segundo plano o una espera larga); no imprimir respuestas enormes (`flow_wait` devuelve los prompts completos de cada plano: pedir solo el último `job_id`, o usar la API local, ver `flow-video`); no releer archivos grandes; resumir.

## Flujo, fase por fase

| # | Fase | Qué se hace | Con qué | Puerta (qué aprueba la persona) | Queda guardado en |
|---|---|---|---|---|---|
| 1 | Brief y problema real | Cliente, marca emisora, objetivo, público, **qué problema se cuenta** (por ejemplo, el tono de la pista contra la voz) y quién lo cuenta. Leer la ficha del cliente, incluido el casting | `brief`, `content-angles` | El mensaje y el casting | `brief.md` |
| 2 | Guion y lista de planos | Guion, narración, y **lista de planos** con tipo, duración y costo estimado; qué voz suena en cada tramo (real o narración) | `reel-script`, `storyboard` | La lista de planos y el costo total | `script.md`, `storyboard.md` |
| 3 | Casting | Elenco **completo**: por cada persona, ficha, retrato, cuerpo, voz e información, con nombre `CLIENTE-Rol-Nombre` | `flow-cast`, `flow-video` (`flow_character`) | **La ficha, el retrato, el cuerpo, y verlos en la lista de Characters de Flow** | `brand/cast.md`, `flow-character.md` |
| 4 | Plano de prueba | Un solo plano, el más importante (por lo general un general) | `flow-video` | El clip de prueba: identidad, encuadre, sin texto | `flow-character.md` |
| 5 | Lote | El resto de los planos, ya con presupuesto aprobado | `flow-video` | El presupuesto | `flow-character.md` (prompts y costo) |
| 5b | **Scenes de Flow (obligatorio)** | Armar en Flow una Scene por escena del reel para que las partes queden coherentes entre sí; **bajarlas y los clips al proyecto** | Scenes de Flow (`flow-video`) | El corte visto en Flow | `source/videos/<versión>/scenes/` y `/clips/` |
| 6 | Recepción y control | Bajar los clips, hoja de contactos de cada uno, revisar texto y artefactos, medir boca y tamaño de cara, reprocesar con `keyint=1` | `flow-video`, `av-sync` | Qué clips se aceptan y cuáles se descartan | `source/videos/` |
| 7 | Audio | Medir la voz real (`voice.py`), narración (la voz la provee la persona), subtítulos | `av-sync`, `voiceover`, `captions` | La narración y la música | `source/sync/` |
| 8 | Edición — **preguntar tecnología si no está decidida: Remotion o HyperFrames** (con **Studio/preview encendido** en cualquiera de las dos) | Composición a medida con la línea de tiempo en `timeline.ts` (Remotion) o `hyperframes/index.html` con GSAP (HyperFrames); arranques de audio y clip salen de `plan.py` | `custom-reel` + `av-sync` (Remotion) o `hyperframes-video` (HyperFrames) | Lo que se ve en Studio/preview y los cuadros de control | `remotion/` o `hyperframes/`, `sync.md` |
| 9 | Verificación y entrega | `verify.py` sobre el MP4 final, loudness, cuadros clave, `brand-review`, estado `en-revision`, caption | `av-sync`, `video`, `brand-review`, `social-copy` | La aprobación final | `final/`, `review.md` |

## Gramática de planos (lo que ya costó caro aprender)

- **Con una voz real que no es del avatar, no se ve la boca de cerca.** La boca generada no forma las sílabas de esa letra y se nota. Usar planos medios o generales, de espaldas, de perfil, detalle de manos con el micrófono y reacciones de los demás, y cortar en los huecos de frase medidos.
- **Narración sobre una cara:** solo con la boca cerrada, o sobre planos de reacción con bocas cerradas (en loop ping-pong si son cortos).
- **Plano continuo** cuando hay que cubrir una voz larga, sin cortes a otras personas dentro del tramo.
- **Sin texto en ninguna toma:** sin letreros, neones con letras, pantallas con letras, logos en la ropa, ni especificaciones técnicas en el prompt ("24fps" apareció escrito en pantalla).
- **Dramatizar el problema real** con el cuerpo, no con esfuerzo genérico: por ejemplo, tono demasiado grave = voz apagada, hombros caídos y mentón al pecho; tono correcto = pecho abierto y mirada arriba. Medir el problema antes (altura de la voz, `av-sync`) para no contar la historia contraria.
- **Casting** según la ficha del cliente (edad, fenotipo, ropa). Si la ficha no lo dice, se pregunta en la fase 1.

## Costos de referencia (Omni 1.1 Flash, 720p, 9:16)

| Qué | Créditos |
|---|---|
| Clip de 4 s / 6 s / 8 s / 10 s | 7 / 10 / 12 / 15 |
| Imágenes y retratos | 0 |
| Crear un Character | 0 |
| Descargar (incluido el escalado a 1080p) | 0 |
| Veo 3.1 (clip fijo de 8 s) | Lite 10, Fast 20, Quality 100 |

Un reel con 9 planos de Omni sale cerca de 90 créditos. Se cuenta antes de pedir el OK, y se suma lo ya gastado en la sesión.

## Memoria compartida (vault `om`)

**Al inicio:** `search` "reel Flow Remotion" y "<cliente> reel"; `recall` con `projects: ["brandforge-os"]`. Leé también `reference/clientes/<Cliente>.md` si existe; si no, decí que ese cliente no tiene ficha en el vault. Decí qué lecciones de Flow, Remotion o Characters ya están registradas antes de proponer el plan y su costo. Lo de otro cliente no se copia.

**Al cierre:** `record_work` del reel (título con el cliente al principio): costo real en créditos comparado con el estimado, qué se probó y descartó, qué quedó abierto. `remember` solo para lo que generaliza, sin el nombre del cliente.

## Errores que ya pasaron (2026-10-10, primer reel hecho con este flujo)

| Error | Consecuencia | Regla |
|---|---|---|
| `flow_character` falló y se siguió con fotos de referencia sin avisar | En Flow quedó un solo Character; trabajo perdido | Regla 2 y 6; `flow-video` |
| Lote de 9 planos lanzado sin probar uno | 81 créditos sin revisar | Regla 3 |
| Se tomaron "los primeros 3.5 s" de un audio | Era instrumental sin voz | Regla 5; `av-sync` |
| whisper para detectar canto | Palabras de corrido, sin huecos | `av-sync` |
| Escenas estiradas con números sueltos en varios archivos | Subtítulos descolgados | `timeline.ts` único |
| Primer plano del avatar con voz real encima | "Canta otra cosa" | Gramática de planos |
| Protagonista cuya edad y aspecto no coincidían con el público de la ficha del cliente | Casting equivocado | Casting desde la ficha del cliente (`flow-cast`) |
| Scenes armadas en Flow pero sin bajar los videos al proyecto ni mostrar nada en Remotion Studio | La persona no podía ver el avance y Remotion no tenía los archivos | Reglas 8 y 10 |
| Guion y narración escritos con formato propio, sin plantilla, sin ficha de voz, sin `brand-review` y partidos en "partes" | Hubo que rehacerlos | Regla 9 |
| Se contó "el tono es muy alto" cuando la toma decía "Muy Bajo" | Historia contraria | Medir el problema antes de dramatizarlo |
