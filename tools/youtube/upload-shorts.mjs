#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";
import { getAuthorizedClient } from "./auth.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pieceDir = path.resolve(__dirname, "../../media/the-field");
const rendersDir = path.join(pieceDir, "shorts/renders");

const videoEnPath = path.join(rendersDir, "the-field-short-01-en.mp4");
const videoEsPath = path.join(rendersDir, "the-field-short-01-es.mp4");

if (!fs.existsSync(videoEnPath) || !fs.existsSync(videoEsPath)) {
  console.error("Missing one or both rendered short mp4 files in media/the-field/shorts/renders/");
  process.exit(1);
}

const auth = await getAuthorizedClient();
const youtube = google.youtube({ version: "v3", auth });

async function uploadVideo({ videoPath, title, description, tags, language, label }) {
  const fileSize = fs.statSync(videoPath).size;
  console.log(`\n========================================================`);
  console.log(`  Subiendo Short: ${label}`);
  console.log(`  Archivo: ${videoPath} (${(fileSize / (1024 * 1024)).toFixed(1)} MB)`);
  console.log(`  Título:  ${title}`);
  console.log(`  Idioma:  ${language}`);
  console.log(`========================================================\n`);

  const requestBody = {
    snippet: {
      title,
      description,
      tags,
      categoryId: "10", // Music
      defaultLanguage: language,
      defaultAudioLanguage: language,
    },
    status: {
      privacyStatus: "private",
      selfDeclaredMadeForKids: false,
      license: "youtube",
      publicStatsViewable: true,
    },
  };

  const res = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody,
      media: {
        body: fs.createReadStream(videoPath),
      },
    },
    {
      onUploadProgress: (evt) => {
        const bytes = evt.bytesRead || 0;
        const pct = Math.round((bytes / fileSize) * 1000) / 10;
        const mb = (bytes / (1024 * 1024)).toFixed(1);
        const totalMb = (fileSize / (1024 * 1024)).toFixed(1);
        process.stdout.write(`\r  Progreso: ${mb} / ${totalMb} MB (${pct}%)`);
      },
    }
  );

  const videoId = res.data.id;
  console.log(`\n\n✓ ¡Subido con éxito!`);
  console.log(`  ID:          ${videoId}`);
  console.log(`  Enlace:      https://youtube.com/shorts/${videoId}`);
  console.log(`  Studio Edit: https://studio.youtube.com/video/${videoId}/edit`);
  return videoId;
}

async function main() {
  const shorts = [
    {
      label: "Short 01 — English",
      videoPath: videoEnPath,
      title: "The Field · What if Sound is Only the Surface? | 432 Hz Ambient #Shorts",
      description: `What if what we call sound is only the consequence? Beneath what you hear, frequencies and harmonics move through the field. Watch half a million grains of quartz release their geometry and fall back into stillness.

Tuned to A = 432 Hz with a gentle binaural layer (best with headphones).

Watch the full 6-minute 4K piece: https://youtu.be/8QGj_FvP5Xo
Series playlist: https://www.youtube.com/playlist?list=PLX0Afm4O4W30

This is music, not medical advice or treatment.

#Shorts #ambientmusic #432hz #binauralbeats #sacredgeometry #cymatics #thefield`,
      tags: [
        "the field",
        "ambient music",
        "meditation music",
        "432 hz",
        "binaural beats",
        "cymatics",
        "sacred geometry",
        "generative art",
        "sound design",
        "sound healing",
        "frequency",
        "chladni",
        "shorts",
      ],
      language: "en",
    },
    {
      label: "Short 01 — Español (Voz Lionel)",
      videoPath: videoEsPath,
      title: "The Field · ¿Y si el sonido es solo la consecuencia? | 432 Hz #Shorts",
      description: `¿Y si lo que llamamos sonido es solo la consecuencia? Por debajo de lo que escuchás, frecuencias y armónicos se mueven a través del campo. Mirá medio millón de granos de cuarzo soltar su geometría y volver a la quietud.

Afinada a A = 432 Hz con una capa binaural sutil (mejor con auriculares).

Mirá la obra completa en 4K (6 min): https://youtu.be/8QGj_FvP5Xo
Playlist de la serie: https://www.youtube.com/playlist?list=PLX0Afm4O4W30

Esto es música, no consejo ni tratamiento médico.

#Shorts #ambientmusic #432hz #binauralbeats #geometriasagrada #cimatica #meditacion #thefield`,
      tags: [
        "the field",
        "musica ambiental",
        "musica para meditar",
        "432 hz",
        "ondas binaurales",
        "cimatica",
        "geometria sagrada",
        "relajacion",
        "frecuencias",
        "meditacion guiada",
        "shorts",
      ],
      language: "es",
    },
  ];

  const results = [];
  for (const short of shorts) {
    const id = await uploadVideo(short);
    results.push({ ...short, id });
  }

  console.log("\n========================================================");
  console.log("  RESUMEN DE SUBIDA A YOUTUBE (MODO PRIVADO)");
  console.log("========================================================");
  for (const r of results) {
    console.log(`\n• ${r.label}:`);
    console.log(`  Short URL:   https://youtube.com/shorts/${r.id}`);
    console.log(`  Studio Edit: https://studio.youtube.com/video/${r.id}/edit`);
  }
  console.log("\nAmbos videos listos en modo privado para revisión del usuario.");
}

main().catch((err) => {
  console.error("\nError durante la subida:", err);
  process.exit(1);
});
