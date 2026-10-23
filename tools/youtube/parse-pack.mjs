#!/usr/bin/env node
// Parses a composition's media/<name>/<name>.youtube.md and media/<name>/<name>.yaml
// into a structured, validated payload ready for the YouTube Data API v3 (EN primary + ES localization,
// chapters verification, tags character limit check, thumbnail path, playlist ID, and pinned comment).
// Also supports parsing media/<name>/<name>.shorts.md for Short promotional clips.

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export const DEFAULT_PLAYLIST_ID = "PLX0Afm4O4W30";

/**
 * Resolves a piece name or path (e.g. "the-field" or "media/the-field") to its media/<name> directory.
 */
export function resolvePieceDir(input, projectRoot = process.cwd()) {
  const clean = input.replace(/\/+$/, "");
  const direct = path.resolve(projectRoot, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) {
    return direct;
  }
  const underMedia = path.resolve(projectRoot, "media", path.basename(clean));
  if (fs.existsSync(underMedia) && fs.statSync(underMedia).isDirectory()) {
    return underMedia;
  }
  throw new Error(`Composition directory not found for "${input}" (checked ${direct} and ${underMedia})`);
}

/**
 * Extracts markdown tables or code blocks under specific headings in <name>.youtube.md.
 */
export function parseYoutubePack(pieceDir) {
  const name = path.basename(pieceDir);
  const yamlPath = path.join(pieceDir, `${name}.yaml`);
  const packPath = path.join(pieceDir, `${name}.youtube.md`);

  if (!fs.existsSync(packPath)) {
    throw new Error(`Missing YouTube publish pack: ${packPath}. Run the youtube-publish skill first.`);
  }

  const yamlData = fs.existsSync(yamlPath)
    ? YAML.parse(fs.readFileSync(yamlPath, "utf8"))
    : { name };
  const md = fs.readFileSync(packPath, "utf8");

  // 1. Extract recommended EN and ES titles from the Titles tables
  // Format in pack: | **1 (recommended)** | Title \| Subtitle | 91 |
  const titlesSection = extractSection(md, "Titles");
  const titleEn = extractRecommendedTableCell(titlesSection, "EN") || extractFirstTableRowTitle(titlesSection, 0);
  const titleEs = extractRecommendedTableCell(titlesSection, "ES") || extractFirstTableRowTitle(titlesSection, 1);

  // 2. Extract EN and ES descriptions (fenced ``` blocks under ## Description — EN and ## Description — ES)
  const descEnSection = extractSection(md, "Description — EN");
  const descEsSection = extractSection(md, "Description — ES");
  const descriptionEn = extractFirstCodeBlock(descEnSection);
  const descriptionEs = extractFirstCodeBlock(descEsSection);

  // 3. Extract tags from ## Hashtags and tags
  const tagsSection = extractSection(md, "Hashtags and tags");
  const tags = extractTags(tagsSection);

  // 4. Extract pinned comments (EN / ES) from ## Pinned comment
  const commentSection = extractSection(md, "Pinned comment");
  const commentEn = extractInlineCodeAfterPrefix(commentSection, "EN:");
  const commentEs = extractInlineCodeAfterPrefix(commentSection, "ES:");

  // 5. Playlist ID (from pack or default series playlist)
  const playlistMatch = md.match(/playlist\?list=([A-Za-z0-9_-]+)/);
  const playlistId = playlistMatch ? playlistMatch[1] : DEFAULT_PLAYLIST_ID;

  // 6. Video & Thumbnail paths
  const videoPath = path.join(pieceDir, "renders", `${name}.mp4`);
  const thumbFromYaml = yamlData?.publish?.thumbnail
    ? path.join(pieceDir, yamlData.publish.thumbnail)
    : null;
  const defaultThumbPath = path.join(pieceDir, "renders", "thumbnails", `${name}-thumbnail.jpg`);
  const thumbnailPath = thumbFromYaml && fs.existsSync(thumbFromYaml) ? thumbFromYaml : defaultThumbPath;

  const payload = {
    name,
    pieceDir,
    yamlPath,
    packPath,
    videoPath,
    thumbnailPath,
    playlistId,
    categoryId: "10", // Music
    madeForKids: false,
    alteredOrSynthetic: false, // Abstract generative visuals & synthesized audio (YouTube Help 14328491)
    en: {
      title: titleEn,
      description: descriptionEn,
      comment: commentEn,
    },
    es: {
      title: titleEs,
      description: descriptionEs,
      comment: commentEs,
    },
    tags,
  };

  const validation = validatePayload(payload);
  return { payload, validation, yamlData };
}

/**
 * Validates the extracted YouTube pack against verified YouTube Help rules (youtube-publish skill).
 */
export function validatePayload(payload, { isShort = false } = {}) {
  const errors = [];
  const warnings = [];

  if (!payload.en.title) {
    errors.push("Missing English title (EN #1 recommended).");
  } else if (payload.en.title.length > 100) {
    errors.push(`English title exceeds 100 characters (${payload.en.title.length} chars).`);
  }

  if (!payload.es.title) {
    warnings.push("Missing Spanish title localization (ES #1 recommended).");
  } else if (payload.es.title.length > 100) {
    errors.push(`Spanish title exceeds 100 characters (${payload.es.title.length} chars).`);
  }

  if (!payload.en.description) {
    errors.push("Missing English description block.");
  } else {
    if (payload.en.description.length > 5000) {
      errors.push(`English description exceeds 5000 characters (${payload.en.description.length} chars).`);
    }
    const hashtags = payload.en.description.match(/#[A-Za-z0-9_]+/g) || [];
    if (hashtags.length > 60) {
      errors.push(`Too many hashtags (${hashtags.length} > 60); YouTube ignores all hashtags above 60.`);
    } else if (hashtags.length > 6) {
      warnings.push(`Found ${hashtags.length} hashtags; deph standard is 3 to 6.`);
    }

    if (!isShort) {
      const chaptersCheck = verifyChapters(payload.en.description);
      if (!chaptersCheck.ok) {
        errors.push(`Chapters check (EN): ${chaptersCheck.reason}`);
      }
    }
  }

  if (!payload.es.description) {
    warnings.push("Missing Spanish description block for localization.");
  }

  const totalTagsChars = payload.tags.join(",").length;
  if (totalTagsChars > 500) {
    errors.push(`Total tags length (${totalTagsChars} chars) exceeds YouTube's 500-character ceiling.`);
  }

  // Honesty rule check: no medical claims
  const forbiddenClaims = /\b(heals?|cures?|treats?\s+anxiety|treats?\s+insomnia|medical\s+treatment|chakra\s+healing)\b/i;
  if (forbiddenClaims.test(payload.en.description || "") || forbiddenClaims.test(payload.en.title || "")) {
    errors.push("Honesty rule violation: detected medical/healing claim in title or description.");
  }

  const videoExists = fs.existsSync(payload.videoPath);
  if (!videoExists) {
    warnings.push(`Video file not currently on disk: ${payload.videoPath} (render it before live upload).`);
  }

  const thumbExists = payload.thumbnailPath && fs.existsSync(payload.thumbnailPath);
  if (!isShort) {
    if (!thumbExists) {
      warnings.push(`Thumbnail file not found at ${payload.thumbnailPath}`);
    } else {
      const stat = fs.statSync(payload.thumbnailPath);
      if (stat.size > 2 * 1024 * 1024) {
        errors.push(`Thumbnail exceeds YouTube's 2 MB limit (${(stat.size / (1024 * 1024)).toFixed(2)} MB).`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    videoExists,
    thumbExists,
    stats: {
      titleEnChars: payload.en.title?.length ?? 0,
      titleEsChars: payload.es.title?.length ?? 0,
      descEnChars: payload.en.description?.length ?? 0,
      descEsChars: payload.es.description?.length ?? 0,
      tagsCount: payload.tags.length,
      tagsChars: totalTagsChars,
    },
  };
}

function verifyChapters(description) {
  const lines = description.split(/\r?\n/);
  const tsRegex = /^(\d{1,2}):(\d{2})\s+.+/;
  const stamps = [];
  for (const line of lines) {
    const m = line.trim().match(tsRegex);
    if (m) {
      const sec = Number(m[1]) * 60 + Number(m[2]);
      stamps.push(sec);
    }
  }
  if (stamps.length === 0) {
    return { ok: false, reason: "No chapter timestamps found in description." };
  }
  if (stamps[0] !== 0) {
    return { ok: false, reason: `First chapter must start at 0:00 (found ${stamps[0]}s).` };
  }
  if (stamps.length < 3) {
    return { ok: false, reason: `YouTube requires at least 3 chapters (found ${stamps.length}).` };
  }
  for (let i = 1; i < stamps.length; i++) {
    const diff = stamps[i] - stamps[i - 1];
    if (diff < 10) {
      return { ok: false, reason: `Chapters must be ascending and >= 10s apart (gap of ${diff}s at index ${i}).` };
    }
  }
  return { ok: true, count: stamps.length };
}

function extractSection(md, headingPrefix) {
  const escaped = headingPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^##\\s+${escaped}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s+|\\Z)`, "m");
  // Fallback manual split if \Z isn't matched in JS regex
  const lines = md.split(/\r?\n/);
  let capturing = false;
  const buf = [];
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (capturing) break;
      if (line.slice(3).trim().toLowerCase().startsWith(headingPrefix.toLowerCase())) {
        capturing = true;
        continue;
      }
    } else if (capturing) {
      buf.push(line);
    }
  }
  return buf.join("\n").trim();
}

function extractRecommendedTableCell(sectionText, langHeader) {
  const lines = sectionText.split(/\r?\n/);
  let inTargetTable = false;
  for (const line of lines) {
    if (line.includes(`| ${langHeader} |`)) {
      inTargetTable = true;
      continue;
    }
    if (inTargetTable) {
      if (!line.trim().startsWith("|")) {
        if (line.trim() === "") continue;
        inTargetTable = false;
        continue;
      }
      if (line.toLowerCase().includes("recommended") || line.includes("| **1")) {
        const rawCells = splitMarkdownRow(line);
        if (rawCells.length >= 2) {
          return rawCells[1].replace(/\\\|/g, "|").trim();
        }
      }
    }
  }
  return null;
}

function extractFirstTableRowTitle(sectionText, tableIndex) {
  const tables = sectionText.split(/\n\s*\n/).filter((b) => b.includes("|"));
  const tbl = tables[tableIndex];
  if (!tbl) return null;
  for (const line of tbl.split(/\r?\n/)) {
    if (line.includes("recommended") || line.match(/^\|\s*\*?\*?1/)) {
      const cells = splitMarkdownRow(line);
      if (cells.length >= 2) return cells[1].replace(/\\\|/g, "|").trim();
    }
  }
  return null;
}

function splitMarkdownRow(line) {
  // Split by unescaped |
  const placeholder = "\u0000PIPE\u0000";
  const safe = line.replace(/\\\|/g, placeholder);
  return safe
    .split("|")
    .slice(1, -1)
    .map((c) => c.replaceAll(placeholder, "|").trim());
}

function extractFirstCodeBlock(sectionText) {
  const m = sectionText.match(/```[^\n]*\n([\s\S]*?)```/);
  return m ? m[1].trim() : null;
}

function extractTags(sectionText) {
  // Match "- **Tags...:** tag1, tag2, ..." possibly spanning multiple lines until a period or blank line
  const m = sectionText.match(/\*\*Tags[^*]*\*\*\s*([\s\S]*?)(?:\n\s*\n|\n-\s+)/i) ||
            sectionText.match(/\*\*Tags[^*]*\*\*\s*([\s\S]*)/i);
  if (!m) return [];
  const raw = m[1]
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => !l.startsWith("Deliberately") && !l.startsWith("Literal,"))
    .join(" ");
  // Stop at the first sentence-ending period followed by commentary ("Literal, few...", "Deliberately few...")
  const cleaned = raw.replace(/\.\s+(?:Deliberately|Literal|YouTube|No artist)[\s\S]*$/i, "").replace(/\.$/, "");
  return cleaned
    .split(",")
    .map((t) => t.replace(/^:\s*/, "").trim())
    .filter(Boolean);
}

function extractInlineCodeAfterPrefix(sectionText, prefix) {
  for (const line of sectionText.split(/\r?\n/)) {
    if (line.trim().startsWith(prefix)) {
      const m = line.match(/`([^`]+)`/);
      if (m) return m[1].trim();
      return line.trim().slice(prefix.length).trim();
    }
  }
  return null;
}
