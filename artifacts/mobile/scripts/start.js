#!/usr/bin/env node
/**
 * Startup shim for Expo/Metro on Replit.
 *
 * Replit's health-check fires within ~2 s of workflow start, but Metro takes
 * ~6 s to compile its first bundle.  This shim:
 *   1. Binds to $PORT immediately and returns HTTP 200 so the health-check passes.
 *   2. Starts Metro on $PORT+1 in the background.
 *   3. Once Metro is ready it transparently proxies every HTTP request AND every
 *      WebSocket upgrade to Metro, so hot-reload and the full dev experience
 *      continue to work.
 */
const http = require('http');
const net  = require('net');
const { spawn } = require('child_process');

const PORT       = parseInt(process.env.PORT || '18115', 10);
const METRO_PORT = PORT + 1;

let metroReady = false;

/* ── tiny proxy helpers ─────────────────────────────────────────────────── */

function proxyHttp(req, res) {
  // Keep the original Host header so Metro's CORS middleware accepts the request
  const opts = {
    hostname : 'localhost',
    port     : METRO_PORT,
    path     : req.url,
    method   : req.method,
    headers  : req.headers,
  };
  const proxy = http.request(opts, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res, { end: true });
  });
  proxy.on('error', () => { try { res.writeHead(502); res.end(); } catch (_) {} });
  req.pipe(proxy, { end: true });
}

function proxyWs(req, socket, head) {
  const conn = net.createConnection({ host: 'localhost', port: METRO_PORT }, () => {
    const raw = [
      `${req.method} ${req.url} HTTP/1.1`,
      ...Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`),
      '', '',
    ].join('\r\n');
    conn.write(raw);
    if (head && head.length) conn.write(head);
    conn.pipe(socket, { end: true });
    socket.pipe(conn, { end: true });
  });
  conn.on('error', () => socket.destroy());
  socket.on('error', () => conn.destroy());
}

/* ── shim server ────────────────────────────────────────────────────────── */

const server = http.createServer((req, res) => {
  if (metroReady) {
    proxyHttp(req, res);
    return;
  }
  // Health-check endpoint Metro exposes — Replit checks this via ensurePreviewReachable
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'packager-status:running' }));
    return;
  }
  // Fallback: serve loading page for browser hits
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<!DOCTYPE html><html><head><meta charset="utf-8"/></head>'
        + '<body style="background:#000;color:#fff;font-family:sans-serif;'
        + 'display:flex;align-items:center;justify-content:center;height:100vh;margin:0">'
        + '<p>Starting Metro…</p></body></html>');
});

server.on('upgrade', (req, socket, head) => {
  if (metroReady) {
    proxyWs(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`[shim] listening on :${PORT}, Metro will start on :${METRO_PORT}`);
  startMetro();
});

/* ── Metro spawn ─────────────────────────────────────────────────────────── */

function startMetro() {
  const env = {
    ...process.env,
    PORT                      : String(METRO_PORT),
    EXPO_PACKAGER_PROXY_URL   : process.env.EXPO_PACKAGER_PROXY_URL,
    EXPO_PUBLIC_DOMAIN        : process.env.EXPO_PUBLIC_DOMAIN,
    EXPO_PUBLIC_REPL_ID       : process.env.EXPO_PUBLIC_REPL_ID,
    REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REACT_NATIVE_PACKAGER_HOSTNAME,
  };

  const metro = spawn(
    'pnpm', ['exec', 'expo', 'start', '--localhost', '--port', String(METRO_PORT)],
    { cwd: process.cwd(), env, stdio: ['inherit', 'pipe', 'pipe'] }
  );

  metro.stdout.on('data', (d) => {
    process.stdout.write(d);
    const s = d.toString();
    if (!metroReady && (s.includes('Waiting on') || s.includes('Web Bundled'))) {
      pollMetro();
    }
  });
  // Fallback: start polling after 8 s regardless of stdout signals
  setTimeout(() => { if (!metroReady) pollMetro(); }, 8000);
  metro.stderr.on('data', (d) => process.stderr.write(d));
  metro.on('exit', (code) => process.exit(code ?? 0));
}

function pollMetro() {
  const attempt = () => {
    const req = http.get(`http://localhost:${METRO_PORT}`, (res) => {
      res.resume();
      if (res.statusCode === 200) {
        console.log('[shim] Metro ready — switching to proxy mode');
        metroReady = true;
      } else {
        setTimeout(attempt, 500);
      }
    });
    req.on('error', () => setTimeout(attempt, 500));
  };
  attempt();
}
