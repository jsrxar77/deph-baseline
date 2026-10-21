#!/usr/bin/env node

/**
 * scan_plugins.js
 * Scans installed VSTs, VST3s, and Audio Units from Ableton Live's internal database
 * and system plugin directories on macOS. Generates an up-to-date catalog in .agents/catalogs/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = process.env.HOME || '';
const LIVE_DB_PATH = path.join(HOME, 'Library/Application Support/Ableton/Live Database/Live-plugins-1.db');
const OUTPUT_DIR = fs.existsSync(path.join(__dirname, '../catalogs'))
  ? path.join(__dirname, '../catalogs')
  : path.join(__dirname, '../.agents/catalogs');
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'plugins.json');
const MD_OUTPUT = path.join(OUTPUT_DIR, 'plugins.md');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function scanAbletonDatabase() {
  if (!fs.existsSync(LIVE_DB_PATH)) {
    console.warn(`[WARN] Ableton database not found at ${LIVE_DB_PATH}`);
    return [];
  }

  const query = `
    SELECT 
      p.name, 
      p.vendor, 
      GROUP_CONCAT(p.subcategories, ' ') as subcategories, 
      MAX(p.version) as version, 
      MAX(m.path) as path 
    FROM plugins p 
    LEFT JOIN plugin_modules m ON p.module_id = m.module_id 
    WHERE p.enabled = 1 
    GROUP BY p.name, p.vendor 
    ORDER BY p.vendor ASC, p.name ASC;
  `;

  try {
    const raw = execSync(`sqlite3 -json "${LIVE_DB_PATH}" "${query.replace(/\n/g, ' ')}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });

    const parsed = JSON.parse(raw);
    return parsed.map(item => {
      const rawSub = item.subcategories || '';
      const uniqueTags = Array.from(new Set(rawSub.split(/[\s|]+/).filter(Boolean)));
      const subLower = rawSub.toLowerCase();
      let type = 'Effect';
      if (subLower.includes('synth') || subLower.includes('instrument') || item.name.toLowerCase().includes('synth')) {
        type = 'Instrument';
      }
      return {
        name: item.name,
        vendor: item.vendor || 'Unknown',
        type,
        categories: uniqueTags.join(', ') || (type === 'Instrument' ? 'Instrument' : 'Fx'),
        version: item.version || '',
        path: item.path || ''
      };
    });
  } catch (err) {
    console.error(`[ERROR] Failed to query Ableton database:`, err.message);
    return [];
  }
}

function scanSystemDirectories() {
  const dirs = [
    '/Library/Audio/Plug-Ins/VST3',
    '/Library/Audio/Plug-Ins/Components',
    '/Library/Audio/Plug-Ins/VST'
  ];

  const found = [];
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.endsWith('.vst3') || file.endsWith('.component') || file.endsWith('.vst')) {
            found.push({
              file,
              dir,
              fullPath: path.join(dir, file)
            });
          }
        });
      } catch (e) {
        // ignore read errors
      }
    }
  });
  return found;
}

function generateCatalog() {
  console.log('🔍 Scanning installed plugins for Javier...');
  const plugins = scanAbletonDatabase();
  const systemFiles = scanSystemDirectories();

  const instruments = plugins.filter(p => p.type === 'Instrument');
  const effects = plugins.filter(p => p.type === 'Effect');

  const catalog = {
    lastUpdated: new Date().toISOString(),
    totalPlugins: plugins.length,
    counts: {
      instruments: instruments.length,
      effects: effects.length
    },
    instruments: instruments.sort((a, b) => a.name.localeCompare(b.name)),
    effects: effects.sort((a, b) => a.name.localeCompare(b.name)),
    systemFilesCount: systemFiles.length
  };

  ensureDirectoryExistence(JSON_OUTPUT);
  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(catalog, null, 2), 'utf8');

  // Generate clean Markdown representation
  let md = `# 🎛️ VST & Audio Units Catalog\n\n`;
  md += `*Última actualización: ${catalog.lastUpdated}*\n`;
  md += `*Total detectados en Ableton Live: ${catalog.totalPlugins} (${catalog.counts.instruments} Instrumentos, ${catalog.counts.effects} Efectos)*\n\n`;

  md += `## 🎹 Instrumentos y Sintetizadores (${catalog.counts.instruments})\n\n`;
  md += `| Instrumento | Vendor | Categoría | Versión |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  catalog.instruments.forEach(inst => {
    md += `| **${inst.name}** | ${inst.vendor} | ${inst.categories || 'Instrument'} | ${inst.version || '-'} |\n`;
  });

  md += `\n## 🎚️ Efectos y Procesamiento (${catalog.counts.effects})\n\n`;
  md += `| Efecto | Vendor | Categoría | Versión |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  catalog.effects.forEach(fx => {
    md += `| **${fx.name}** | ${fx.vendor} | ${fx.categories || 'Fx'} | ${fx.version || '-'} |\n`;
  });

  fs.writeFileSync(MD_OUTPUT, md, 'utf8');

  console.log(`✅ Catálogo generado con éxito:`);
  console.log(`   - JSON: ${JSON_OUTPUT}`);
  console.log(`   - Markdown: ${MD_OUTPUT}`);
  console.log(`\n🎹 Instrumentos detectados (${instruments.length}):`);
  instruments.forEach(i => console.log(`   • [${i.vendor}] ${i.name} (${i.categories || 'Instrument'})`));
  console.log(`\n🎚️ Efectos detectados (${effects.length}):`);
  effects.forEach(e => console.log(`   • [${e.vendor}] ${e.name} (${e.categories || 'Fx'})`));
}

generateCatalog();
