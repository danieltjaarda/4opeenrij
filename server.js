const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 4000;
const GAMES_DIR = path.join(__dirname, 'games');
const games = {};   // naam -> { title, icon, page, files, max, rooms: { code -> room } }
const lobby = new Map(); // ws -> { code, naam }
const ROOM_TTL = 5 * 60 * 1000;

const codeOf = c => (/^\d{4}$/.test(c || '') ? c : '0000');
function lobbyMsg(code) {
  const members = [...lobby.values()].filter(l => l.code === code).map(l => l.naam || 'Naamloos');
  return JSON.stringify({ type: 'lobby', code, members, games: Object.entries(games).map(([id, g]) => { const r = g.rooms[code]; const inRoom = r ? r.players.map((p, i) => p ? (r.names[i] || 'Naamloos') : null).filter(Boolean) : [];
    return { id, title: g.title, icon: g.icon, players: inRoom.length, max: g.max, waiting: inRoom, rooms: Object.values(g.rooms).filter(x => x.players.some(Boolean)).length }; }) });
}
const lobbyUpdate = () => lobby.forEach((l, p) => p.readyState === 1 && p.send(lobbyMsg(l.code)));
function makeBroadcast(room) {
  return () => { const msg = JSON.stringify(room.state()); room.players.forEach(p => p && p.readyState === 1 && p.send(msg)); lobbyUpdate(); };
}
// Maak een kamer; timers die het spel tijdens room() aanmaakt worden onthouden zodat we ze kunnen stoppen
function makeRoom(def, code) {
  const timers = [], origSI = global.setInterval;
  global.setInterval = (...a) => { const h = origSI(...a); timers.push(h); return h; };
  let room; try { room = def.room(); } finally { global.setInterval = origSI; }
  room.code = code; room.timers = timers; room.broadcast = makeBroadcast(room);
  return room;
}
function getRoom(id, code) {
  const g = games[id]; if (!g) return null;
  if (!g.rooms[code]) { g.rooms[code] = makeRoom(g, code); console.log('Kamer ' + code + ' geopend voor ' + g.title); }
  return g.rooms[code];
}
// Lege kamers na 5 minuten opruimen
setInterval(() => { const now = Date.now(); for (const [id, g] of Object.entries(games)) for (const [code, r] of Object.entries(g.rooms)) {
  if (r.players.some(Boolean)) { r.emptySince = 0; continue; }
  if (!r.emptySince) r.emptySince = now; else if (now - r.emptySince > ROOM_TTL) { r.timers.forEach(clearInterval); delete g.rooms[code]; console.log('Kamer ' + code + ' van ' + g.title + ' gesloten'); }
} }, 30000);
function loadGame(file) {
  const id = path.basename(file, '.js');
  if (!file.endsWith('.js') || games[id]) return;
  try {
    const def = require(path.join(GAMES_DIR, file));
    const probe = makeRoom(def, 'probe'); probe.timers.forEach(clearInterval);
    games[id] = { ...def, max: probe.players.length, rooms: {} };
    console.log('Spel geladen: ' + def.title + '  →  /' + id);
    lobbyUpdate();
  } catch (e) { console.error('Kon spel niet laden: ' + file, e.message); }
}
fs.readdirSync(GAMES_DIR).sort().forEach(loadGame);
// Nieuwe spellen verschijnen zonder herstart
fs.watch(GAMES_DIR, (ev, file) => { if (file && !games[path.basename(file, '.js')]) setTimeout(() => fs.existsSync(path.join(GAMES_DIR, file)) && loadGame(file), 300); });

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'POST' && url === '/clientlog') { let body = ''; req.on('data', c => body += c); req.on('end', () => { console.log(new Date().toLocaleTimeString('nl-NL') + ' CLIENT ' + (req.headers['cf-connecting-ip'] || req.socket.remoteAddress) + ' ' + body.slice(0, 400)); res.writeHead(204); res.end(); }); return; }
  if (url !== '/games.json') console.log(new Date().toLocaleTimeString('nl-NL') + ' HTTP ' + url + '  ' + (req.headers['cf-connecting-ip'] || req.socket.remoteAddress));
  let file = null, type = 'text/html';
  if (url === '/') file = 'index.html';
  else if (url === '/kamer.js') { res.writeHead(200, { 'Content-Type': 'application/javascript' }); return res.end(fs.readFileSync(path.join(__dirname, 'kamer.js'))); }
  else if (url === '/games.json') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(lobbyMsg(codeOf(new URL(req.url, 'http://x').searchParams.get('code')))); }
  else if (games[url.slice(1)]) file = games[url.slice(1)].page;
  else for (const g of Object.values(games)) if (g.files && g.files[url]) { file = g.files[url]; type = 'application/javascript'; }
  if (!file || !fs.existsSync(path.join(__dirname, file))) { res.writeHead(404); return res.end('Niet gevonden'); }
  res.writeHead(200, { 'Content-Type': type });
  res.end(fs.readFileSync(path.join(__dirname, file)));
});
const wss = new WebSocketServer({ server });

// Heartbeat: verbindingen die niet meer reageren (slapende tab, weggevallen wifi) na 15 s opruimen
setInterval(() => wss.clients.forEach(ws => { if (ws.alive === false) return ws.terminate(); ws.alive = false; ws.ping(); }), 15000);
wss.on('connection', (ws, req) => {
  ws.alive = true; ws.on('pong', () => ws.alive = true);
  const who = (req.headers['cf-connecting-ip'] || req.socket.remoteAddress) + ' ' + String(req.headers['user-agent'] || '').slice(0, 60);
  console.log(new Date().toLocaleTimeString('nl-NL') + ' WS open  ' + req.url + '  ' + who);
  ws.on('close', () => console.log(new Date().toLocaleTimeString('nl-NL') + ' WS dicht ' + req.url + '  ' + who));
  const q = new URL(req.url, 'http://x').searchParams, id = q.get('game'), code = codeOf(q.get('code'));
  if (id === 'lobby') { lobby.set(ws, { code, naam: String(q.get('naam') || '').slice(0, 14) }); lobbyUpdate(); ws.on('message', d => { let m; try { m = JSON.parse(d); } catch { return; } if (m.type === 'naam') { lobby.get(ws).naam = String(m.naam || '').slice(0, 14); lobbyUpdate(); } }); ws.on('close', () => { lobby.delete(ws); lobbyUpdate(); }); return; }
  const room = getRoom(id, code); if (!room) return ws.close();
  const idx = room.players.indexOf(null);
  if (idx === -1) { ws.send(JSON.stringify({ type: 'full' })); ws.close(); return; }
  room.players[idx] = ws;
  ws.send(JSON.stringify({ type: 'welcome', player: idx + 1 }));
  if (room.onJoin) room.onJoin(idx);
  room.broadcast();
  ws.on('message', data => {
    let m; try { m = JSON.parse(data); } catch { return; }
    if (m.type === 'naam') { room.names[idx] = String(m.naam || '').slice(0, 14); lobbyUpdate(); }
    else room.onMessage(idx, m);
    if (!room.quiet || !room.quiet(m)) room.broadcast();
  });
  ws.on('close', () => { room.players[idx] = null; room.names[idx] = ''; room.onLeave(idx); room.broadcast(); });
});

server.listen(PORT, () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('Spellen draaien!');
  console.log('  Jij:          http://localhost:' + PORT);
  ips.forEach(ip => console.log('  Vriend (LAN): http://' + ip + ':' + PORT));
});
