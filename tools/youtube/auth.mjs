#!/usr/bin/env node
// OAuth 2.0 helper for YouTube Data API v3.
// Stores client_secret.json and tokens.json inside tools/youtube/.credentials/ (git-ignored).
// Run `node tools/youtube/auth.mjs` once to authorize the deph YouTube channel in your browser.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CREDENTIALS_DIR = path.join(__dirname, ".credentials");
export const CLIENT_SECRET_PATH = path.join(CREDENTIALS_DIR, "client_secret.json");
export const TOKENS_PATH = path.join(CREDENTIALS_DIR, "tokens.json");

const PORT = 3847;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;

export const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

function loadClientConfig() {
  if (!fs.existsSync(CLIENT_SECRET_PATH)) {
    throw new Error(
      `No se encontró ${CLIENT_SECRET_PATH}.\n` +
      `Sigue la guía paso a paso en tools/youtube/SETUP-OAUTH-ES.md para descargar tu client_secret.json de Google Cloud.`
    );
  }
  const raw = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, "utf8"));
  const cfg = raw.installed || raw.web;
  if (!cfg || !cfg.client_id || !cfg.client_secret) {
    throw new Error(`El archivo ${CLIENT_SECRET_PATH} no tiene el formato OAuth 2.0 esperado (installed o web).`);
  }
  return cfg;
}

export async function getAuthorizedClient() {
  const cfg = loadClientConfig();
  const oauth2Client = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, REDIRECT_URI);

  if (!fs.existsSync(TOKENS_PATH)) {
    throw new Error(
      `Aún no has autorizado tu canal de YouTube (${TOKENS_PATH} no existe).\n` +
      `Ejecuta primero: node tools/youtube/auth.mjs`
    );
  }

  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
  oauth2Client.setCredentials(tokens);

  oauth2Client.on("tokens", (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(merged, null, 2), { mode: 0o600 });
  });

  return oauth2Client;
}

async function runInteractiveAuth() {
  fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  const cfg = loadClientConfig();
  const oauth2Client = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\n========================================================");
  console.log("  deph — Autorización OAuth 2.0 con YouTube Data API v3");
  console.log("========================================================\n");
  console.log("Abriendo el navegador para autorizar el canal de YouTube...");
  console.log("Si no se abre solo, entra en este enlace:\n");
  console.log(authUrl + "\n");

  execFile("open", [authUrl], () => {});

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
      if (reqUrl.pathname !== "/oauth2callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const err = reqUrl.searchParams.get("error");
      const authCode = reqUrl.searchParams.get("code");
      if (err) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h2>Error de autorización: ${err}</h2><p>Puedes cerrar esta pestaña.</p>`);
        server.close();
        reject(new Error(`OAuth error: ${err}`));
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<body style="background:#050508;color:#f2fbff;font-family:'Avenir Next',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">` +
        `<div style="text-align:center;border:1px solid #7fd4f5;padding:32px 48px;border-radius:12px;">` +
        `<h2 style="color:#7fd4f5;letter-spacing:0.1em;">deph · YOUTUBE CONECTADO</h2>` +
        `<p>Autorización completada. Ya puedes cerrar esta ventana y volver a la terminal.</p>` +
        `</div></body>`
      );
      server.close();
      resolve(authCode);
    });
    server.listen(PORT, "127.0.0.1");
  });

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
  console.log(`\n✓ Tokens guardados de forma segura en ${TOKENS_PATH}`);

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const me = await youtube.channels.list({ part: ["snippet"], mine: true });
  const ch = me.data.items?.[0];
  if (ch) {
    console.log(`✓ Canal verificado: "${ch.snippet.title}" (ID: ${ch.id})`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runInteractiveAuth().catch((err) => {
    console.error("\n✗ Error:", err.message);
    process.exit(1);
  });
}
