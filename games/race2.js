// Kart Race Pro: bots, items, schansen
const TRACK = require('../track.js'); const T2 = require('../track2.js');
module.exports = { title: 'Kart Race Pro', icon: '🏁', page: 'race2.html', room: raceRoom, files: { '/track.js': 'track.js', '/track2.js': 'track2.js' } };
const BOT_NAMES = ['Luigi-bot', 'Peach-bot', 'Toad-bot', 'Yoshi-bot', 'Bowser-bot', 'Daisy-bot'];
const BOT_COLORS = [0x2ecc71, 0xff8fd8, 0x3498db, 0x9bffb0, 0xf39c12, 0xffd166];
const ITEMS = ['boost', 'shell', 'banana', 'lightning', 'boost', 'shell', 'banana'];
function raceRoom() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] };
  let phase, bots, karts, startAt, order, tick = 0, boxes, bananas, shells, nextId = 1, events;
  const reset = () => {
    phase = 'wait'; order = []; startAt = 0; events = [];
    bots = BOT_NAMES.map((name, i) => ({ name, color: BOT_COLORS[i], dist: -20 - i * 6, lateral: (i % 2 ? 1 : -1) * (2 + (i >> 1) * 1.6), speed: 0, maxSpeed: 28 + Math.random() * 5, lap: 0, finished: 0, noise: Math.random() * 100, stun: 0, small: 0 }));
    karts = [null, null]; boxes = T2.BOXES.map(b => ({ ...b, active: true, respawn: 0 })); bananas = []; shells = [];
  };
  reset();
  const begin = () => { phase = 'countdown'; startAt = Date.now() + 3500; };
  const ev = (type, data) => { events.push({ id: nextId++, t: Date.now(), type, ...data }); if (events.length > 30) events.shift(); };
  const posOf = k => k.bot ? TRACK.pointAt(k.dist, k.lateral) : { x: k.x, z: k.z };
  const allKarts = () => [...bots.map(b => ({ ...b, bot: true })), ...karts.map((k, i) => k && { ...k, player: i + 1 }).filter(Boolean)];
  room.state = () => ({ type: 'state', phase, startAt, now: Date.now(), order, connected: room.players.map(p => !!p), names: room.names, score: room.score,
    karts: karts.map((k, i) => k && { ...k, name: room.names[i] || 'Speler ' + (i + 1) }),
    bots: bots.map(b => ({ name: b.name, color: b.color, dist: b.dist, lateral: b.lateral, lap: b.lap, finished: b.finished, stun: b.stun, small: b.small })),
    boxes: boxes.map(b => b.active ? 1 : 0), bananas, shells, events });
  room.quiet = m => m.type === 'kart';
  room.onMessage = (idx, m) => {
    if (m.type === 'start' && phase === 'wait') begin();
    if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) begin(); }
    if (m.type === 'kart') { const old = karts[idx] || {}; karts[idx] = { ...old, x: m.x, z: m.z, y: m.y || 0, rot: m.rot, speed: m.speed, lap: m.lap, dist: m.dist, item: old.item || null, stun: old.stun || 0, small: old.small || 0 };
      if (m.lap >= TRACK.LAPS && !karts[idx].finished && phase === 'race') { karts[idx].finished = Date.now(); order.push({ name: room.names[idx] || 'Speler ' + (idx + 1), player: idx + 1 }); if (order.length === 1) room.score[idx]++; } }
    if (m.type === 'pickup' && karts[idx]) { const b = boxes[m.id]; if (b && b.active && !karts[idx].item) { b.active = false; b.respawn = Date.now() + 6000; karts[idx].item = ITEMS[Math.floor(Math.random() * ITEMS.length)]; ev('pickup', { player: idx + 1 }); } }
    if (m.type === 'use' && karts[idx] && karts[idx].item && phase === 'race') { const k = karts[idx], item = k.item; k.item = null;
      if (item === 'boost') { k.boostUntil = Date.now() + 1800; ev('boost', { player: idx + 1 }); }
      if (item === 'banana') { const back = TRACK.pointAt(k.dist - 4, 0); bananas.push({ id: nextId++, x: k.x - Math.sin(k.rot) * 3, z: k.z - Math.cos(k.rot) * 3, owner: idx + 1 }); ev('banana', { player: idx + 1 }); }
      if (item === 'shell') { shells.push({ id: nextId++, x: k.x + Math.sin(k.rot) * 3, z: k.z + Math.cos(k.rot) * 3, dist: k.dist + 3, lateral: 0, owner: idx + 1, life: 6, target: null }); ev('shell', { player: idx + 1 }); }
      if (item === 'lightning') { const now = Date.now(); bots.forEach(b => { b.small = now + 5000; b.stun = now + 800; }); karts.forEach((o, i) => { if (o && i !== idx) { o.small = now + 5000; o.stun = now + 800; } }); ev('lightning', { player: idx + 1 }); }
    }
    if (m.type === 'hitbanana') { const i = bananas.findIndex(b => b.id === m.id); if (i >= 0 && karts[idx]) { bananas.splice(i, 1); karts[idx].stun = Date.now() + 1500; ev('spin', { player: idx + 1 }); } }
  };
  room.onJoin = () => { if (room.players[0] && room.players[1] && phase === 'wait') begin(); };
  room.onLeave = () => reset();
  setInterval(() => {
    const now = Date.now();
    if (phase === 'countdown' && now >= startAt) phase = 'race';
    boxes.forEach(b => { if (!b.active && now >= b.respawn) b.active = true; });
    if (phase !== 'race') return;
    const dt = 1 / 30; tick++;
    for (const b of bots) {
      if (b.finished) { b.speed = Math.max(0, b.speed - 10 * dt); b.dist += b.speed * dt; continue; }
      let target = b.maxSpeed + Math.sin(now / 1000 + b.noise) * 2; if (b.small > now) target *= 0.6; if (b.stun > now) target = 0;
      b.speed += (target - b.speed) * dt * (b.stun > now ? 4 : 0.8); b.dist += b.speed * dt; b.lap = Math.floor(b.dist / TRACK.LEN);
      b.lateral += Math.sin(now / 2500 + b.noise) * dt * 0.8; b.lateral = Math.max(-5, Math.min(5, b.lateral));
      // bots raken bananen
      const p = TRACK.pointAt(b.dist, b.lateral); const bi = bananas.findIndex(bn => Math.hypot(bn.x - p.x, bn.z - p.z) < 1.6); if (bi >= 0 && b.stun < now) { bananas.splice(bi, 1); b.stun = now + 1500; ev('spin', { bot: b.name }); }
      if (b.lap >= TRACK.LAPS) { b.finished = now; order.push({ name: b.name, bot: true }); }
    }
    // schilden: volgen de baan, zoeken de dichtstbijzijnde kart vooruit
    for (let i = shells.length - 1; i >= 0; i--) { const s = shells[i]; s.life -= dt; if (s.life <= 0) { shells.splice(i, 1); continue; }
      const all = allKarts().filter(k => !(k.player === s.owner)); let best = null, bd = 1e9;
      for (const k of all) { const p = posOf(k); const d = Math.hypot(p.x - s.x, p.z - s.z); if (d < bd) { bd = d; best = { k, p }; } }
      const ahead = TRACK.pointAt(s.dist + 6, s.lateral); let tx = ahead.x, tz = ahead.z;
      if (best && bd < 40) { tx = best.p.x; tz = best.p.z; }
      const dx = tx - s.x, dz = tz - s.z, dl = Math.hypot(dx, dz) || 1; const sp = 46; s.x += dx / dl * sp * dt; s.z += dz / dl * sp * dt; const n = TRACK.nearest(s.x, s.z, Math.round(s.dist / TRACK.STEP)); s.dist = n.dist; s.lateral = Math.max(-5, Math.min(5, n.lateral));
      if (best && bd < 1.8) { shells.splice(i, 1); const k = best.k; if (k.bot) { const b = bots.find(b => b.name === k.name); b.stun = now + 1500; ev('spin', { bot: b.name }); } else { karts[k.player - 1].stun = now + 1500; ev('spin', { player: k.player }); } }
    }
    if (order.length >= 8 || (karts.every(k => !k || k.finished) && bots.every(b => b.finished))) phase = 'done';
    if (tick % 2 === 0) room.broadcast();
  }, 1000 / 30);
  return room;
}
