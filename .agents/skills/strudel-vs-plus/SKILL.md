---
name: strudel-vs-plus
description: >-
  Manage, develop, extend, and maintain Strudel VS + (Dual Audio & MIDI Engine extension for VS Code / Antigravity IDE).
  Enforces the strict documentation standard where all project truth resides exclusively in /docs/ across
  exactly four canonical documents: ARCHITECTURE.md, FEATURES.md, ROADMAP.md, and DEBT.md.
---

# Strudel VS + Skill 🎹⚡

Este skill rige el desarrollo, arquitectura, mantenimiento y ciclo de vida de **Strudel VS +**, la extensión de live-coding para Visual Studio Code y Antigravity IDE equipada con doble motor de salida: **Audio Engine** (Web Audio sintetizado y soundbanks) y **MIDI Engine** (emisión MIDI multicanal en tiempo real con destino directo a DAWs como Ableton Live), preservando la sincronía visual del avance de notas (*live highlighting*).

---

## 🏛️ Regla Fundamental: Fuente Única de la Verdad (SSOT)

Toda la documentación técnica del proyecto se almacena en el directorio [`/docs`](file:///Users/javier/Projects/strudel-basline/docs) y se gestiona **exclusiva y estrictamente a través de 4 documentos canónicos, ni más ni menos**:

1. [docs/ARCHITECTURE.md](file:///Users/javier/Projects/strudel-basline/docs/ARCHITECTURE.md):
   * Especificación arquitectónica del sistema dual (*Audio Engine* y *MIDI Engine*).
   * Modelo de eventos de Strudel (`haps`), scheduler, puente de comunicación Webview <-> Extension Host (`vscode.postMessage`), emisor MIDI y sistema de sincronía visual del editor (`TextEditorDecorationType`).

2. [docs/FEATURES.md](file:///Users/javier/Projects/strudel-basline/docs/FEATURES.md):
   * Catálogo de funcionalidades operativas de *Strudel VS +*.
   * Panel lateral UI con doble motor independiente/paralelo.
   * Ruteo multicanal MIDI hacia Ableton Live (`midichan(1..16)`).
   * Mapeo General MIDI para Drum Racks (C1 = 36) e instrumentos.
   * Sistema de iluminación y avance de notas en vivo (*Live Note Highlighting*).
   * Atajos de teclado y comandos de ejecución.

3. [docs/ROADMAP.md](file:///Users/javier/Projects/strudel-basline/docs/ROADMAP.md):
   * Estado de versiones y ciclo de desarrollo (v1.0.0 a futuro).
   * Hitos completados y planificados (soporte MPE, clock MIDI sync, presets de DAW, empaquetado para marketplace).

4. [docs/DEBT.md](file:///Users/javier/Projects/strudel-basline/docs/DEBT.md):
   * Registro transparente de deuda técnica y limitaciones conocidas.
   * Manejo de latencia en buffers, permisos de puertos MIDI en macOS/Windows.
   * Auditoría de dependencias (`@strudel/core`, `easymidi`/`webmidi`, `esbuild`, `vsce`).
   * Tareas de refactorización y optimización futuras.

---

## 📋 Flujo de Trabajo para Agentes

1. **Lectura Obligatoria**: Antes de proponer o ejecutar cambios de código en la extensión, el agente DEBE consultar los 4 documentos en `/docs`.
2. **Actualización Aditiva**: Cualquier nueva funcionalidad debe actualizar simultáneamente `ARCHITECTURE.md` (si cambia el diseño), `FEATURES.md` (si añade capacidades), `ROADMAP.md` (marcando hitos) y `DEBT.md` (si deja pendientes o advertencias técnicas).
3. **Prohibición de Archivos Extra en `/docs`**: NO se permite crear archivos adicionales (como `NOTES.md`, `TODO.md` o guías sueltas) dentro de `/docs`. Toda información técnica debe ubicarse en el documento canónico correspondiente.
