# Slow Drift en Ableton: guía paso a paso (nivel cero)

Esta guía lleva **Slow Drift** desde Strudel a Ableton Live 12 Suite para refinar su sonido con tus plugins, grabarlo
y (si quieres) masterizarlo ahí. No da nada por sabido: cada término se explica la primera vez que aparece.

- **Qué se lleva a Ableton**: 4 voces como MIDI (drone, sub, pad, bells) y 1 voz como audio (la binaural).
- **Qué NO se pierde**: el tiempo exacto de cada nota, la afinación a 432 Hz (va dentro del MIDI, no tienes que tocar
  nada) y los fades de volumen de cada sección (van como *velocity*, ver Parte 3).
- **Qué hay que recrear a mano con efectos**: reverb, delay, paneo y filtro. Abajo están los valores que usaba Strudel.
- **Importante**: los presets sugeridos los elegí por nombre y por sus parámetros medidos en los archivos, **no
  escuchándolos** (no puedo oír audio). Si alguno no te gusta, cámbialo; la guía dice qué ajustar en cualquier preset.

Los archivos están en `media/slow-drift/daw/` (regenerables en cualquier momento; ver el final):

| Archivo | Qué es |
|---|---|
| `tracks/01-drone.mid` | voz drone (MIDI, canal 1) |
| `tracks/02-sub.mid` | voz sub (MIDI, canal 2) |
| `tracks/03-pad.mid` | voz pad (MIDI, canal 3) |
| `tracks/04-bells.mid` | voz bells, campanas (MIDI, canal 4) |
| `stems/05-binaural.wav` | capa binaural (audio, ya lista) |
| `../sync/audio-master.wav` | la versión de Strudel completa, como **referencia** para comparar |

## Mini glosario

- **Pista (track)**: una fila horizontal en Ableton. Hay pistas **MIDI** (notas que tocan un instrumento) y pistas de
  **audio** (un archivo de sonido).
- **Clip**: un bloque de notas o de audio dentro de una pista.
- **Arrangement View**: la vista de línea de tiempo horizontal (izquierda → derecha). Se alterna con la *Session
  View* (vista de columnas) con la tecla **Tab**. En esta guía usamos **siempre Arrangement View**.
- **Compás (bar)**: la regla numerada arriba de la línea de tiempo (1, 2, 3…). En Slow Drift, **1 compás = 2
  segundos** y la pieza dura **180 compases**.
- **Browser**: el panel de la izquierda con instrumentos, efectos y plugins. Se muestra/oculta con **Cmd+Opt+B**.
- **Device View**: el panel de abajo, donde aparecen el instrumento y los efectos de la pista seleccionada.
- **Velocity**: la "fuerza" con que se toca cada nota MIDI (1–127). Aquí lleva el volumen de cada nota.
- **Main**: la pista final donde se suma todo (en versiones anteriores de Live se llamaba *Master*).

---

## Parte 1 · Preparar Ableton (una sola vez)

1. Abre **Ableton Live 12 Suite** → menú **File → New Live Set** (Cmd+N).
2. Abre **Live → Settings…** (Cmd+,).
   - Pestaña **Plug-Ins**: activa **Use Audio Units v2** y **Use VST3 Plug-In System Folders**. Si Live pregunta,
     deja que reescanee.
   - Pestaña **Link, Tempo & MIDI**: en la tabla *MIDI Ports*, busca la fila **In: IAC Driver (Bus 1)** y pon en
     **On** la columna **Track**. Esto sirve para las pruebas en vivo (Parte 2B).
   - Pestaña **Record, Warp & Launch**: **desactiva "Auto-Warp Long Samples"**. Si queda activado, Ableton estira
     los audios largos para "cuadrarlos" y la binaural y la referencia se desalinean.
   - Cierra Settings.
3. **Tempo**: arriba a la izquierda hay un número (normalmente `120.00`). Haz doble clic, escribe **120** y Enter.
   Slow Drift va a 120 BPM porque 1 ciclo de Strudel = 1 compás de 4/4 = 2 segundos. El compás a su lado debe
   decir **4 / 4**.
4. Pulsa **Tab** hasta ver la **Arrangement View** (línea de tiempo horizontal).
5. Borra las pistas de ejemplo que trae el set nuevo: clic en el nombre de cada pista → tecla **Supr/Delete**.

---

## Parte 2 · Crear las 4 pistas MIDI con sus instrumentos

Repite estos pasos para cada voz de la tabla. El plugin es siempre **Surge XT**, gratuito y ya instalado; es el
que verifiqué que respeta la afinación y los fades.

| Pista | Nombre | Preset de Surge XT | Canal MIDI | Paneo | Volumen inicial |
|---|---|---|---|---|---|
| 1 | drone | **Pads → MKS-70 Warm Pad** | 1 | 15L | −4 dB |
| 2 | sub | **Basses → Sub 1** | 2 | C | −9 dB |
| 3 | pad | **Pads → Still** | 3 | C (lo mueve Auto Pan) | 0 dB |
| 4 | bells | **Plucks → Fantasy Bell** | 4 | C (lo mueve Auto Pan) | −16 dB |

Los volúmenes iniciales salen de los niveles relativos en Strudel (`daw/tracks.json`). Son un punto de partida:
cada preset suena más o menos fuerte por sí mismo, así que al final se equilibran de oído (Parte 5).

### 2A · Crear la pista y cargar el instrumento

1. Crea una pista MIDI: **Cmd+Shift+T**.
2. Renómbrala: clic en su nombre → **Cmd+R** → escribe el nombre (p. ej. `drone`) → Enter.
3. En el **Browser** (izquierda), escribe **Surge XT** en el buscador. Aparecerán *Surge XT* y *Surge XT Effects*.
   Arrastra **Surge XT** (el instrumento, **no** "Effects") sobre la pista.
4. Abajo, en la Device View, aparece Surge XT. Haz clic en el icono de **llave inglesa** de su cabecera para abrir su
   ventana.
5. **Cargar el preset**: en la parte superior central de Surge está el nombre del preset actual (p. ej. *Init
   Saw*). Haz clic en ese nombre y, en el menú, entra en la categoría y elige el preset de la tabla (p. ej.
   **Pads → MKS-70 Warm Pad**). También puedes moverte con las flechas `<` `>` a su lado.
6. **Ajuste obligatorio: Vel > Gain = −40 dB.** En la zona inferior derecha de Surge está la sección del
   amplificador (*Amp*), con los controles **Gain** y **Vel > Gain**.
   - Haz clic derecho sobre **Vel > Gain**; la primera línea del menú muestra el valor y permite escribirlo.
   - Escribe **-40** y Enter. Si no te deja escribir, arrastra el control hasta que marque −40 dB.
   - **Por qué**: casi todos los presets vienen en 0 dB, lo que significa "ignorar la velocity". Los fades de Slow
     Drift (el drone que entra suave en la intro, el pad que crece, el outro que se apaga) viajan en la velocity. Con
     −40 dB, Surge los reproduce **exactamente** como en Strudel (lo comprobé en el código de Surge).
7. **Envolvente de volumen (Amp EG)**: abajo a la derecha hay dos envolventes, *Filter EG* y **Amp EG**, cada una
   con los controles **A** (ataque), **D** (decaimiento), **S** (sostenido) y **R** (relajación). Ajusta el **Amp
   EG** igual que en el paso 6 (clic derecho → escribir valor):

   | Pista | A (attack) | D (decay) | S (sustain) | R (release) |
   |---|---|---|---|---|
   | drone | deja el del preset (≈6.6 s, ya es lento) | — | 100 % | **10 s** |
   | sub | **4 s** | — | 100 % | **8 s** |
   | pad | **3 s** | **1.5 s** | **40 %** | **6 s** |
   | bells | deja el del preset (golpe inmediato) | deja el del preset | deja el del preset | **6 s** |

   Son los valores de Strudel. El ataque lento es lo que hace que el drone y el pad "aparezcan" en vez de
   golpear.
8. **Paneo**: en la cabecera de la pista hay un control de paneo (muestra `C`, de *center*). Solo el **drone** va en
   **15L**: arrástralo hasta que diga 15L.
9. **Volumen**: en la cabecera de la pista hay un campo de volumen (muestra `0.00`). Arrástralo hasta el valor de la
   tabla.

### 2B · (Opcional) Probar sonidos en vivo antes de importar nada

Sirve para escuchar Slow Drift con estos instrumentos y cambiar presets al vuelo, sin importar aún los clips.

1. Muestra las entradas/salidas de las pistas: menú **View → In/Out** (Cmd+Opt+I). En cada pista aparece
   **MIDI From**.
2. En cada pista MIDI:
   - **MIDI From**: **IAC Driver (Bus 1)**.
   - Debajo, el canal: **Ch. 1** para drone, **Ch. 2** sub, **Ch. 3** pad, **Ch. 4** bells.
   - **Monitor**: **In**. Así la pista suena con lo que llega por IAC sin tener que armarla.
3. **No pulses Play en Ableton.** Dime "listo para probar en vivo" y yo lanzo la pieza por el bus IAC. Puedo
   empezar en cualquier sección, p. ej. en el clímax, y si editas y guardas el `.strudel`, sigue sonando con los
   cambios desde el mismo punto. El comando, por si quieres lanzarlo tú desde la terminal:
   ```
   node tools/sounds/midi-live.mjs media/slow-drift/sounds/slow-drift.strudel --cycles 180 --names drone,sub,pad,bells --watch --from 36
   ```
   (`--from 36` = empezar en el clímax; `Ctrl+C` lo detiene y silencia todo.)
4. Mientras suena, cambia presets en Surge (paso 5 de 2A) y escucha. Recuerda repetir **Vel > Gain −40 dB** en cada
   preset nuevo.
5. **Al terminar las pruebas**, en cada pista vuelve a poner **Monitor: Auto**. Si no, cuando haya clips y además
   llegue MIDI por IAC, sonaría doble.

Secciones de la pieza (para `--from` y para orientarte en la línea de tiempo):

| Sección | Compases | `--from` | Tiempo |
|---|---|---|---|
| Intro | 1–12 | 0 | 0:00 |
| Desarrollo | 13–36 | 12 | 0:24 |
| Clímax | 37–108 | 36 | 1:12 |
| Desaceleración | 109–156 | 108 | 3:36 |
| Outro | 157–180 | 156 | 5:12 |

---

## Parte 3 · Importar la versión final (los archivos `.mid`)

1. En Finder abre `deph-baseline/media/slow-drift/daw/tracks/`. Truco: en el Browser de Ableton, **Places → Add
   Folder…** y elige `media/slow-drift/daw`; así lo tienes siempre a mano dentro de Ableton.
2. Arrastra **`01-drone.mid`** sobre la pista **drone**, soltándolo **al principio, en el compás 1**. Usa el zoom
   (teclas **+ / −**) para ver bien el inicio. El clip se ajusta solo a la cuadrícula.
3. Igual con `02-sub.mid` → pista sub, `03-pad.mid` → pad, `04-bells.mid` → bells.
4. **Comprueba** que el borde izquierdo de cada clip está en el compás **1** y que las primeras notas caen donde
   deben. Haz doble clic en un clip para ver sus notas abajo.

   | Pista | Primera nota |
   |---|---|
   | drone | compás 1 |
   | sub | compás 13 |
   | pad | compás 1 |
   | bells | compás 40 (2.º tiempo) |

   Si una pista empieza tarde o temprano, dímelo: no la muevas a ojo.
5. Pulsa la barra espaciadora para reproducir desde el principio. Deberías oír Slow Drift con los nuevos
   instrumentos.

**La afinación 432 Hz ya va incluida**: cada clip lleva un *pitch bend* de −31.8 cents desde el primer instante. No
toques la rueda ni ningún ajuste de afinación. Se comprueba en la Parte 6.

---

## Parte 4 · La capa binaural y la pista de referencia (audio)

### Binaural

1. Crea una pista de audio: **Cmd+T**. Renómbrala `binaural` (Cmd+R).
2. Arrastra `media/slow-drift/daw/stems/05-binaural.wav` a esa pista, en el **compás 1**.
3. Doble clic en el clip → abajo, en Clip View, asegúrate de que el botón **Warp** está **apagado** (gris).
4. **Sin efectos**, paneo en **C** y **ninguna reverb**. La binaural necesita que el oído izquierdo y el derecho
   reciban tonos distintos; una reverb los mezcla y destruye el efecto. Suena muy baja a propósito.

### Referencia (la versión de Strudel)

1. Otra pista de audio (**Cmd+T**) llamada `REFERENCIA`.
2. Arrastra `media/slow-drift/sync/audio-master.wav` al **compás 1**, con **Warp apagado**.
3. Para comparar: pulsa **S** (Solo) en esa pista y oirás solo la versión original; vuelve a pulsarlo para oír la
   nueva. Mientras trabajas, déjala **apagada** con su botón de activación (el cuadrado amarillo numerado de la
   cabecera) para que no se sume a la mezcla. **Tiene que estar apagada al exportar.**

---

## Parte 5 · Efectos (recrear reverb, delay, paneo y filtro)

Los efectos de Ableton se añaden desde el Browser → **Audio Effects**: busca el nombre y arrástralo a la Device View
de la pista, **a la derecha de Surge XT**. El orden importa: de izquierda a derecha, **Auto Filter → Delay → Reverb
→ Auto Pan**. Cada efecto tiene un control **Dry/Wet**: 0 % = sin efecto, 100 % = solo efecto.

Los presets de Surge ya traen sus propios efectos internos. Si algo suena demasiado "lavado", baja primero el
Dry/Wet de los efectos de Ableton.

| Pista | Auto Filter (Lowpass) | Delay | Reverb | Auto Pan |
|---|---|---|---|---|
| drone | Frequency **≈ 700 Hz** | — | Decay **≈ 1 s**, Dry/Wet **≈ 45 %** | — (paneo fijo 15L) |
| sub | Frequency **200 Hz** | — | — (el sub va seco) | — |
| pad | Frequency **≈ 1.1 kHz** | — | Decay **≈ 1 s**, Dry/Wet **≈ 45 %** | Amount **60 %**, Rate **0.017 Hz**, forma seno |
| bells | Frequency **2.8 kHz** | **Sync apagado**, tiempo **1130 ms**, Feedback **55 %**, Dry/Wet **≈ 30 %** | Decay **9 s**, Dry/Wet **≈ 50 %** | Amount **≈ 85 %**, Rate **≈ 0.05 Hz** |

Cómo se traduce cada cosa desde Strudel, por si quieres ajustar de oído:

- **Auto Filter**: el `lpf` de Strudel. En la pieza, el drone abre de 500 a 900 Hz según la sección y el pad oscila
  lento entre 700 y 1600 Hz. Un valor fijo intermedio es suficiente. *Avanzado y opcional*: en el pad, el LFO del
  Auto Filter a **0.012 Hz** recrea la oscilación (1 vuelta cada 82 s).
- **Delay (solo bells)**: el botón con forma de nota o "Sync" debe estar **apagado** para poder poner milisegundos.
  **1130 ms** no es una figura musical a propósito, para que el eco no marque un pulso. Feedback 55 % hace que los
  ecos se acumulen como un pedal de piano.
- **Reverb**: *Decay Time* es la cola en segundos. Las campanas tienen una cola larga (9 s), el drone y el pad
  cortas.
- **Auto Pan** (en Live 12.1+ puede llamarse **Auto Pan-Tremolo**): mueve el sonido de izquierda a derecha. En el
  pad, una vuelta cada 58 s (0.017 Hz), entre 20 % y 80 % del estéreo. En las campanas, movimiento libre casi de lado
  a lado.

**Estilo de la pieza**: las **campanas deben ser un acento sutil, no una quinta voz**. En Strudel hubo que bajarlas
dos veces porque sobresalían. Si al mezclar destacan, bájalas antes que subir lo demás.

**Equilibrio final**: pon la pista REFERENCIA en Solo, escucha 20–30 segundos del clímax (compás 37 en adelante),
quita el Solo y ajusta los volúmenes de las pistas hasta que la proporción entre voces se parezca. No tiene que ser
idéntica: es tu versión refinada.

---

## Parte 6 · Comprobar la afinación 432 Hz (1 minuto)

1. En la pista **drone**, arrastra el efecto **Tuner** (Audio Effects) al final de la cadena.
2. En el Tuner, cambia la **referencia** de 440 a **432 Hz** (el campo de referencia, abajo en el dispositivo).
3. Reproduce desde el compás 1 (el drone está casi solo). El Tuner debería mostrar **C** con una desviación cercana a
   **0 cents** (±5).
   - Si marca unos **+32 cents**, el pitch bend no llegó. Dímelo y lo resolvemos; hay una alternativa dentro de Surge
     (su menú **Tuning** permite fijar la frecuencia de A4). **No hagas las dos cosas a la vez** o la afinación
     bajará el doble.
4. Borra el Tuner (clic en él → Delete). Solo servía para comprobar.

---

## Parte 7 · Guardar el proyecto

**File → Save Live Set As…** → navega a `deph-baseline/media/slow-drift/daw/` → nombre **`slow-drift`** → Guardar.
Ableton crea la carpeta `slow-drift Project/` con el archivo `slow-drift.als`. El `.als` se guarda en git; los audios
que Ableton genere dentro, no.

---

## Parte 8 · Masterizar (dos opciones, elige una cada vez)

**Opción 1: masterizar en Ableton con Ozone**

1. Selecciona la pista **Main** (abajo del todo o a la derecha) y arrastra a su Device View **Ozone 12 Elements**
   (Browser → busca "Ozone 12 Elements").
2. Abre su ventana (llave inglesa), reproduce el clímax (compás 37 en adelante) y usa su **Assistant** para que
   proponga un ajuste.
3. Objetivo del canal: alrededor de **−16 LUFS** y picos por debajo de **−1 dB**. No hace falta clavarlo: yo mido el
   resultado exacto después y te digo si está dentro.
4. Vas a exportar **dos veces** (Parte 9): una con Ozone **apagado** (botón de activación del dispositivo) y otra con
   Ozone **encendido**. La versión sin Ozone la usa el video para reaccionar al audio.

**Opción 2: masterizar con la herramienta del proyecto**

No pongas nada en la pista Main. Exportas una sola vez y yo aplico el mismo mastering que a la versión de Strudel
(una ganancia constante a −16 LUFS, sin compresión, así la dinámica del arco queda intacta).

---

## Parte 9 · Exportar el audio

1. Menú **File → Export Audio/Video** (Cmd+Shift+R).
2. Ajustes:

   | Opción | Valor |
   |---|---|
   | Rendered Track | **Main** |
   | Render Start | **1.1.1** |
   | Render Length | **185.0.0** (180 compases de pieza + 5 = 10 s para que las colas de reverb terminen) |
   | Include Return and Main Effects | **On** |
   | Render as Loop | Off |
   | Convert to Mono | **Off** (¡la binaural necesita estéreo!) |
   | Normalize | **Off** |
   | File Type | **WAV** |
   | Sample Rate | **48000** |
   | Bit Depth | **24** |
   | Dither Options | **No Dither** |
   | Encode MP3 / Video | Off |

3. Comprueba que la pista **REFERENCIA está apagada**.
4. Guarda en `deph-baseline/media/slow-drift/daw/exports/` (crea la carpeta `exports` si no existe):
   - Opción 2, o la exportación **sin Ozone** de la opción 1: **`slow-drift-mix.wav`**
   - Opción 1, exportación **con Ozone**: **`slow-drift-mix-master.wav`**

---

## Parte 10 · Avisarme

Dime **"exporté Slow Drift desde Ableton"** y qué opción de mastering usaste. Yo me encargo de:

1. convertir el audio al formato del pipeline en `media/slow-drift/sync/`;
2. comprobar que sigue **sincronizado** con los keyframes del video (`align-check.mjs`; si hay desfase te digo
   cuánto y cómo corregirlo);
3. medir o aplicar el mastering;
4. regenerar `frames.json`/`manifest.json` y avisarte si la reactividad del video necesita reajuste, porque se
   calibró con la mezcla de Strudel;
5. anotar en el yaml que el audio de Slow Drift ahora viene de Ableton, y registrar tus elecciones de sonido en el
   diario de estilo.

---

## Alternativas a Surge XT (con precauciones)

Si quieres otro color, estos presets existen en esta Mac:

- **Serum 2**: drone → *PD - Analog Soft Cotton*; pad → *PD - Ether* o *PD - Airy Chant*; bells → *BL - Ambient Ice
  Cave Bell Pad* o *MAL - Deep Sea Shell Mallet*.
- **Vital** (packs instalados en `~/Music/Vital`).

Precauciones, porque no pude verificarlas como con Surge:

- **Afinación**: comprueba siempre con el Tuner (Parte 6). El pitch bend asume un rango de ±2 semitonos; si el
  sintetizador usa otro, dímelo y regenero el MIDI con `--bend-range`.
- **Fades**: la velocity está calibrada para la curva de Surge. En otros sintetizadores hay que buscar su ajuste de
  "velocity → volumen" (a veces llamado *Vel*, *Velocity > Amp*…). Los fades serán aproximados.

---

## Regenerar los archivos (si cambia el `.strudel`)

Si la composición cambia en Strudel, pídemelo, o desde la raíz del proyecto:

```
node tools/sounds/midi.mjs media/slow-drift/sounds/slow-drift.strudel --cycles 180 --out-dir media/slow-drift/daw --names drone,sub,pad,bells
node tools/sounds/render.mjs media/slow-drift/sounds/slow-drift.strudel --cycles 180 --only '$4' --out media/slow-drift/daw/stems/05-binaural.wav
```

En Ableton, borra los clips viejos y vuelve a arrastrar los nuevos (Parte 3). Instrumentos, efectos y volúmenes
se quedan como estaban.
