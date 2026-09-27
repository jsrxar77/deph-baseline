# Musica Universalis en Ableton: guía paso a paso (nivel cero)

Esta guía lleva **Musica Universalis** de Strudel a Ableton Live 12 Suite con **Surge XT** y **Serum 2**. Si ya
hiciste la guía de Slow Drift, la Parte 1 ya está hecha; lo demás es nuevo.

- **Qué se lleva**: 6 voces como MIDI (drone, pad, arpegio, bajo, lead, Shepard) y 1 voz como audio (la binaural).
  Todas tocan **el mismo motivo (D-A-G-D) y la misma progresión** (Dm6 – Gsus4 – Csus4 – Dm6, cada 8 compases).
- **Qué va incluido y no tienes que tocar**:
  - el tiempo exacto de cada nota;
  - la afinación a 432 Hz, dentro del MIDI (salvo en el drone, que va aparte con quintas puras; ver Parte 3);
  - las entradas y salidas de cada voz, como *velocity*.
- **Qué recreas tú con efectos**: reverb, delay ping-pong, phaser, filtros y paneo. Abajo están los valores.
- **Importante**: los presets los elegí por nombre y por sus parámetros, **no escuchándolos** (no puedo oír audio).
  Cámbialos a tu gusto; la guía dice qué ajustar en cualquier preset.

Archivos en `media/musica-universalis/daw/` (regenerables; ver el final):

| Archivo | Voz | Canal MIDI |
|---|---|---|
| `tracks/01-drone.mid` | drone: el monocordio (D y su quinta pura, más la octava) | 1 |
| `tracks/02-pad.mid` | pad: la progresión de acordes | 2 |
| `tracks/03-arp.mid` | arpegio psy: el motivo en semicorcheas | 3 |
| `tracks/04-bass.mid` | bajo rodante: la raíz de cada acorde | 4 |
| `tracks/05-lead.mid` | lead: el motivo cantado lento, como campanas | 5 |
| `tracks/06-shepard.mid` | escala de Shepard: la subida infinita del "vuelo" | 6 |
| `stems/07-binaural.wav` | capa binaural (audio) | — |
| `tuning/musica-universalis-pythagorean.scl` y `.kbm` | afinación pitagórica para Surge (solo drone) | — |
| `../sync/audio-master.wav` | la versión de Strudel completa, como **referencia** | — |

## ⚡ Modo automático: Claude ya montó el set (lee esto primero)

Con el servidor MCP de Ableton, Claude construyó el set entero en Live:

- tempo 120 y las 7 pistas (drone, pad, arp, bass, lead, shepard, binaural);
- Surge XT o Serum 2 cargados en cada pista;
- todas las notas en su compás exacto;
- un **Utility** con los fades de cada sección;
- el filtro del arpegio que se abre sección a sección;
- reverb, delay ping-pong (3/16), eco de 1130 ms, phaser y auto pan (una vuelta cada 64 s);
- la binaural sin warp;
- los localizadores Intro / Desarrollo / Climax / Vuelo / Regreso / Outro.

**La mayor parte de esta guía ya no hace falta.** Solo quedan estos pasos, porque Live no deja que nadie de fuera toque
el interior de los plugins. Para abrir la ventana de un plugin: clic en su pista → abajo, en su cabecera, el icono de
**llave inglesa**.

| Pista | 1. Preset | 2. Archivo de afinación (en `media/musica-universalis/daw/tuning/`) | 3. Extra |
|---|---|---|---|
| drone (Surge XT) | **Pads → Subtle Comb Strings** | `musica-universalis-pythagorean.scl` y luego `.kbm` | — |
| pad (Serum 2) | **PD - Interstellar** | `musica-universalis-432.tun` | — |
| arp (Serum 2) | **PL - ChillerTranceSynth** | `musica-universalis-432.tun` | — |
| bass (Serum 2) | **BA - Goa Pepper** | `musica-universalis-432.tun` | — |
| lead (Serum 2) | **BL - Ambient Ice Cave Bell Pad** | `musica-universalis-432.tun` | — |
| shepard (Surge XT) | **Pads → Still** | `musica-universalis-432.scl` y luego `.kbm` | **Vel > Gain = −40 dB** |

Cómo se hace cada paso:

1. **Preset**: primero el preset, después la afinación. Algunos presets reinician ajustes.
   - **Surge XT**: clic en el nombre del preset (arriba al centro) → categoría → preset.
   - **Serum 2**: clic en el nombre del preset (arriba) → buscador → escribe el nombre → doble clic.
2. **Afinación** (lleva los 432 Hz; el drone usa además quintas puras):
   - **Surge XT**: botón **Menu** (abajo a la derecha) → **Tuning** → **Load .scl Tuning…** → el `.scl`. Luego otra vez
     Menu → Tuning → **Load .kbm Keyboard Mapping…** → el `.kbm` del mismo nombre.
   - **Serum 2**: en su menú principal busca **Load Tuning (.tun)…** (puede estar en el menú de ajustes globales,
     "Global Tuning") → el `.tun`. No pude ver la interfaz de Serum; si no lo encuentras, dime qué ves y te guío.
3. **Shepard: Vel > Gain = −40 dB** (sección del amplificador de Surge; clic derecho → escribir −40). Es lo único que
   sigue dependiendo de la velocity: cada voz de la escala aparece y desaparece con su volumen, y eso crea la ilusión
   de subida infinita.
4. **Guardar**: **File → Save Live Set As…** → `media/musica-universalis/daw/` → nombre **musica-universalis**.
5. **Comprobar la afinación** (opcional, 1 minuto): la Parte 7 más abajo, con el Tuner a 432 Hz.
6. Dime **"listo, plugins configurados"**. Grabo la mezcla (2 tramos en tiempo real, unos 9 minutos), compruebo
   sincronía y volumen, y la dejo en `sync/`.

Los fades **no** dependen de la velocity de Serum: van en el Utility de cada pista. Lo que dice la Parte 2 sobre
"Vel > Gain" y la matriz de Serum solo aplica al montaje manual.

---

## Mini glosario

- **Pista (track)**: una fila horizontal. **MIDI** = notas que tocan un instrumento; **audio** = un archivo de sonido.
- **Clip**: un bloque de notas o de audio dentro de una pista.
- **Arrangement View**: la línea de tiempo horizontal. Se alterna con la *Session View* con **Tab**. Usamos
  **siempre Arrangement View**.
- **Compás (bar)**: la regla numerada de arriba. Aquí **1 compás = 2 segundos**; la pieza dura **240 compases (8:00)**.
- **Browser**: el panel izquierdo con instrumentos, efectos y plugins (**Cmd+Opt+B** lo muestra u oculta).
- **Device View**: el panel de abajo, con el instrumento y los efectos de la pista seleccionada.
- **Velocity**: la "fuerza" de cada nota MIDI (1–127). Aquí lleva el volumen de cada nota, y con él los fades.
- **Main**: la pista final donde se suma todo (antes se llamaba *Master*).

## El mapa de la pieza

| Sección | Compases | Tiempo | Qué pasa |
|---|---|---|---|
| Intro (gancho) | 1–8 | 0:00 | Drone, pad y el motivo en el arpegio filtrado, desde el primer segundo. |
| Desarrollo | 9–40 | 0:16 | Entra el bajo rodante (el groove); el arpegio se abre; el lead canta el motivo desde el compás 25. |
| Clímax | 41–104 | 1:20 | Todo junto; el drone suma la octava. |
| Vuelo (break) | 105–136 | 3:28 | Se van el bajo y el arpegio; sube la escala de Shepard. El arpegio vuelve filtrado en los últimos 8 compases. |
| Regreso | 137–200 | 4:32 | Vuelve el groove, el momento más brillante. |
| Outro | 201–240 | 6:40 | Se va el bajo, luego el arpegio y el lead; queda el drone solo, apagándose. |

---

## Parte 1 · Preparar Ableton (si no lo hiciste con Slow Drift)

1. **File → New Live Set** (Cmd+N).
2. **Live → Settings…** (Cmd+,):
   - **Plug-Ins**: activa **Use Audio Units v2** y **Use VST3 Plug-In System Folders**.
   - **Link, Tempo & MIDI**: en *MIDI Ports*, fila **In: IAC Driver (Bus 1)**, columna **Track** en **On**.
   - **Record, Warp & Launch**: **desactiva "Auto-Warp Long Samples"**. Si no, Ableton estira los audios largos y la
     binaural y la referencia se desalinean.
3. **Tempo**: arriba a la izquierda, doble clic en el número → **120** → Enter. Compás **4/4**.
4. **Tab** hasta ver la **Arrangement View**. Borra las pistas de ejemplo (clic en el nombre → Delete).

---

## Parte 2 · Crear las 6 pistas MIDI

| Pista | Nombre | Plugin | Preset | Canal | Volumen inicial |
|---|---|---|---|---|---|
| 1 | drone | **Surge XT** | **Pads → Subtle Comb Strings** | 1 | −2 dB |
| 2 | pad | **Serum 2** | **PD - Interstellar** (alternativas: *PD - Cosmic Aura*, *PD - Voyager*) | 2 | −6 dB |
| 3 | arp | **Serum 2** | **PL - ChillerTranceSynth** (alternativa: *PL - Resonant Pluck*) | 3 | −8 dB |
| 4 | bass | **Serum 2** | **BA - Goa Pepper** (carpeta *Bass → Synth*) | 4 | 0 dB |
| 5 | lead | **Serum 2** | **BL - Ambient Ice Cave Bell Pad** (alternativa cálida: Surge XT *Plucks → Fantasy Bell*) | 5 | −8 dB |
| 6 | shepard | **Surge XT** | **Pads → Still** | 6 | −9 dB |

Por qué dos plugins distintos:
- El **drone** va en Surge porque es el único que carga la afinación pitagórica (Parte 3).
- El **Shepard** va en Surge porque su efecto de "subida infinita" depende de que cada voz aparezca y desaparezca con
  una curva de volumen exacta, y en Surge la velocity se calibra exacta (Vel > Gain = −40 dB).
- El resto va en Serum 2, que tiene los sonidos más "psy".

Los volúmenes iniciales salen de los niveles relativos en Strudel. Son un punto de partida; al final se equilibra de
oído contra la referencia (Parte 6).

### 2A · Para cada pista

1. **Cmd+Shift+T** crea una pista MIDI. Renómbrala: clic en el nombre → **Cmd+R** → escribe → Enter.
2. En el **Browser**, busca **Surge XT** o **Serum 2** según la tabla y arrástralo sobre la pista. Para Surge, el
   instrumento es *Surge XT*, **no** *Surge XT Effects*.
3. Abre la ventana del plugin con el icono de **llave inglesa** en su cabecera (Device View, abajo).
4. **Cargar el preset**:
   - **Surge XT**: clic en el nombre del preset, arriba al centro → categoría → preset.
   - **Serum 2**: clic en el nombre del preset, arriba → navegador de presets → escribe el nombre en el buscador
     (p. ej. `Goa Pepper`) → doble clic.
5. **Ajuste del volumen por velocity** (hace que funcionen las entradas y los fades):
   - **Surge XT** (drone y Shepard): en la sección del amplificador, abajo a la derecha, clic derecho sobre
     **Vel > Gain** → escribe **-40** → Enter. Casi todos los presets vienen en 0 dB, que ignora la velocity.
   - **Serum 2** (pad, arp, bass, lead): no pude comprobar cómo responde cada preset a la velocity. **Prueba**: en
     la Parte 4 reproduce desde el compás 1. El arpegio debe **entrar suave y crecer** durante los primeros 16 s. Si entra de golpe a todo
     volumen, abre la pestaña de modulación de Serum (**MATRIX / MOD**), añade una fila con **Source: Velocity** y
     **Destination: Main Vol** (o *Master Volume*), cantidad **100 %**, y haz lo mismo en pad y bass.
6. **Envolvente de volumen, solo en las pistas Surge** (Amp EG, abajo a la derecha; clic derecho → escribir):

   | Pista | A (attack) | D (decay) | S (sustain) | R (release) |
   |---|---|---|---|---|
   | drone | **3 s** | — | **100 %** | **5 s** |
   | shepard | **0.4 s** | **0.5 s** | **80 %** | **1.2 s** |

   El drone se repite cada 4 compases con estos tiempos cruzados, así suena continuo.

   En Serum deja la envolvente del preset: los tiempos de Strudel son solo una referencia.
7. **Volumen**: arrastra el campo de volumen de la cabecera de la pista hasta el valor de la tabla.

### 2B · (Opcional) Probar sonidos en vivo antes de importar

1. **View → In/Out** (Cmd+Opt+I). En cada pista MIDI:
   - **MIDI From**: **IAC Driver (Bus 1)**;
   - canal: el de la tabla (**Ch. 1** a **Ch. 6**);
   - **Monitor: In**.
2. **No pulses Play en Ableton.** Dime "listo para probar en vivo" y lanzo la pieza por el bus IAC desde la sección
   que quieras. Si editas y guardas el `.strudel`, sigue sonando con los cambios. Para lanzarlo tú:
   ```
   node tools/sounds/midi-live.mjs media/musica-universalis/sounds/musica-universalis.strudel --cycles 240 --names drone,pad,arp,bass,lead,shepard --no-bend drone --watch --from 40
   ```
   (`--from 40` = el clímax; `8` = desarrollo; `104` = vuelo; `136` = regreso; `200` = outro. `Ctrl+C` detiene.)
3. Cambia presets mientras suena. En Surge repite **Vel > Gain −40 dB** con cada preset nuevo.
4. **Al terminar**, vuelve a **Monitor: Auto** en cada pista, o sonará doble cuando haya clips.

---

## Parte 3 · La afinación pitagórica del drone (solo pista 1)

El drone es el monocordio de Pitágoras: su quinta (3:2) y su octava (2:1) suenan en **razones exactas**. Una quinta pura no "bate": el drone queda totalmente quieto. Por eso su MIDI **no lleva pitch bend**;
Surge aplica la afinación, incluidos los 432 Hz.

1. En la ventana de Surge de la pista **drone**, abre el menú principal (botón **Menu**, abajo a la derecha) →
   **Tuning**.
2. **Load .scl Tuning…** → elige `media/musica-universalis/daw/tuning/musica-universalis-pythagorean.scl`.
3. Otra vez **Menu → Tuning → Load .kbm Keyboard Mapping…** → elige `musica-universalis-pythagorean.kbm` (misma
   carpeta).
4. Solo en esta pista. Las demás usan afinación normal a 432 Hz, que va dentro de su MIDI.

---

## Parte 4 · Importar la versión final (los `.mid`)

1. Truco: en el Browser, **Places → Add Folder…** → elige `media/musica-universalis/daw`.
2. Arrastra cada archivo de `tracks/` sobre su pista, en el **compás 1**: `01-drone.mid` → drone,
   `02-pad.mid` → pad, y así hasta `06-shepard.mid`.
3. **Comprueba** que cada clip empieza en el compás **1** y que las primeras notas caen donde deben:

   | Pista | Primera nota |
   |---|---|
   | drone | compás 1 |
   | pad | compás 1 |
   | arp | compás 1 |
   | bass | compás 9 (en el 2.º dieciseisavo: el bajo "rueda" sin golpe en el tiempo) |
   | lead | compás 25 |
   | shepard | compás 105 |

   Si algo empieza en otro lugar, dímelo; no lo muevas a ojo.
4. Barra espaciadora para escuchar.

---

## Parte 5 · Binaural y referencia (audio)

**Binaural**
1. **Cmd+T** crea una pista de audio; llámala `binaural`. Arrastra `stems/07-binaural.wav` al **compás 1**.
2. Doble clic en el clip → **Warp apagado**.
3. **Sin efectos, paneo C, nada de reverb.** Cada oído recibe un tono distinto; una reverb los mezclaría. Va muy baja
   a propósito (mejor con auriculares).

**Referencia**
1. Otra pista de audio, `REFERENCIA`. Arrastra `media/musica-universalis/sync/audio-master.wav` al **compás 1**, con
   **Warp apagado**.
2. **S** (Solo) para oír la versión de Strudel y compararla. Mientras trabajas, apágala con su botón de activación
   (el cuadrado amarillo numerado). **Apagada al exportar.**

---

## Parte 6 · Efectos (lo que hace "volar" la pieza)

Arrastra cada efecto desde el Browser → **Audio Effects** a la Device View de su pista, **a la derecha del plugin**,
en el orden de la tabla. Cada efecto tiene **Dry/Wet** (0 % = sin efecto, 100 % = solo efecto).

| Pista | Efectos, en orden |
|---|---|
| drone | **Reverb**: Decay **6 s**, Dry/Wet **35 %** |
| pad | **Phaser-Flanger** en modo **Phaser**: Rate **≈ 0.1 Hz**, Dry/Wet **40 %** → **Reverb**: Decay **8 s**, Dry/Wet **40 %** → **Auto Pan**: Amount **40 %**, Rate **0.015 Hz** |
| arp | **Auto Filter** (Lowpass): Frequency **≈ 1.5 kHz**, Resonance **≈ 40 %** → **Delay**: **Ping Pong on**, **Sync on**, tiempo **3** (3/16), Feedback **45 %**, Dry/Wet **35 %** → **Reverb**: Decay **3 s**, Dry/Wet **15 %** |
| bass | **Utility**: Width **0 %** (el bajo en mono, normal en psy). Sin reverb. |
| lead | **Delay**: **Sync off**, **1130 ms**, Feedback **50 %**, Dry/Wet **30 %** → **Reverb**: Decay **9 s**, Dry/Wet **50 %** |
| shepard | **Reverb**: Decay **7 s**, Dry/Wet **35 %** |

Qué hace cada cosa:
- **Delay ping-pong del arpegio**: el eco salta de un lado al otro a 3/16 de compás. Es el sello del psy y la
  sensación de "volar".
- **Phaser del pad**: el barrido que da el color psicodélico. En Strudel no se oye porque el render del proyecto no lo
  soporta; en Ableton sí.
- **Auto Filter del arpegio**: en Strudel el filtro del arpegio se abre en cada sección (cerrado en la intro, abierto
  en el clímax, lo más brillante en el regreso). *Opcional*: automatiza su Frequency de ≈ 600 Hz (compás 1) a ≈ 3 kHz
  (compás 137).
- **Bajo**: el preset *Goa Pepper* trae su propio filtro. Si retumba, baja su volumen antes que añadir efectos.

**Estilo deph**: el **lead es un acento**, no una voz principal. Si sobresale, bájalo.

**Equilibrio final**: pon REFERENCIA en Solo, escucha 30 s del clímax (compás 41), quita el Solo y ajusta los
volúmenes hasta que la proporción se parezca. No tiene que ser idéntica: es tu versión.

---

## Parte 7 · Comprobar la afinación (2 minutos)

1. **Serum (432 por pitch bend)**: pon un **Tuner** (Audio Effects) al final de la pista **lead**, con referencia
   **432 Hz**, y reproduce desde el compás 25. Cada nota (D, A, G, D) debe marcar cerca de **0 cents** (±5).
   - Si marcan unos **+32 cents**, el bend no llegó o Serum usa otro rango de bend. Dímelo y regenero el MIDI.
2. **Surge pitagórico**: el drone toca D y A a la vez, y el Tuner solo lee una nota. Para comprobarlo, **silencia la A**:
   haz doble clic en el clip del drone, selecciona las notas A2 de los primeros compases y bájalas a velocity 1 (o
   bórralas en una copia del set). Con el Tuner en la pista (referencia 432), la D debe marcar **0 cents**. Deshaz
   (Cmd+Z) después. Si te parece complicado, sáltalo: el archivo de afinación está verificado.
3. Borra los Tuners.

---

## Parte 8 · Guardar

**File → Save Live Set As…** → `media/musica-universalis/daw/` → nombre **`musica-universalis`**. Ableton crea
`musica-universalis Project/musica-universalis.als`.

---

## Parte 9 · Masterizar (elige una opción)

**Opción 1: en Ableton con Ozone**. Pon **Ozone 12 Elements** en la pista **Main**, usa su **Assistant** durante el
regreso (compás 137) y apunta a unos **−16 LUFS** con picos bajo **−1 dB** (yo mido el resultado exacto). Exportas **dos veces**:
una con Ozone apagado y otra encendido.

**Opción 2: con la herramienta del proyecto**. Nada en la pista Main. Exportas una vez y yo aplico el mastering
(ganancia constante a −16 LUFS, la dinámica del arco intacta).

---

## Parte 10 · Exportar

**File → Export Audio/Video** (Cmd+Shift+R):

| Opción | Valor |
|---|---|
| Rendered Track | **Main** |
| Render Start | **1.1.1** |
| Render Length | **245.0.0** (240 compases + 5 = 10 s para las colas de reverb) |
| Include Return and Main Effects | **On** |
| Render as Loop | Off |
| Convert to Mono | **Off** (la binaural necesita estéreo) |
| Normalize | **Off** |
| File Type | **WAV** |
| Sample Rate | **48000** |
| Bit Depth | **24** |
| Dither Options | **No Dither** |

Con la REFERENCIA **apagada**, guarda en `media/musica-universalis/daw/exports/`:
- sin Ozone (u opción 2): **`musica-universalis-mix.wav`**
- con Ozone (opción 1): **`musica-universalis-mix-master.wav`**

---

## Parte 11 · Avisarme

Dime **"exporté Musica Universalis desde Ableton"** y qué opción de mastering usaste. Yo:
1. lo convierto al formato del pipeline en `sync/`;
2. compruebo que sigue sincronizado con los keyframes del video;
3. mido o aplico el mastering;
4. regenero los keyframes y marco en el yaml que el audio viene de Ableton;
5. anoto tus elecciones de sonido en el diario de estilo.

---

## Regenerar los archivos (si cambia el `.strudel`)

Pídemelo, o desde la raíz del proyecto:

```
node tools/sounds/midi.mjs media/musica-universalis/sounds/musica-universalis.strudel --cycles 240 --out-dir media/musica-universalis/daw --names drone,pad,arp,bass,lead,shepard --no-bend drone
node tools/sounds/render.mjs media/musica-universalis/sounds/musica-universalis.strudel --cycles 240 --only '$6' --tail 8 --out media/musica-universalis/daw/stems/07-binaural.wav
node tools/sounds/scl.mjs --root D --a4 432 --out media/musica-universalis/daw/tuning/musica-universalis-pythagorean
```

En Ableton, borra los clips viejos y arrastra los nuevos (Parte 4). Instrumentos, afinación y efectos se quedan.
