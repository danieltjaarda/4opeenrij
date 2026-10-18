// Kart Race
const TRACK = require('../track.js');
module.exports = { title: 'Kart Race', icon: '🏎️', page: 'race.html', room: raceRoom, files: { '/track.js': 'track.js' } };
const BOT_NAMES = ['Luigi-bot', 'Peach-bot', 'Toad-bot', 'Yoshi-bot', 'Bowser-bot', 'Daisy-bot'];
const BOT_COLORS = [0x2ecc71, 0xff8fd8, 0x3498db, 0x9bffb0, 0xf39c12, 0xffd166];
function raceRoom() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] };
  let phase, bots, karts, startAt, order, tick = 0;
  const reset = () => {
    phase = 'wait'; order = []; startAt = 0;
    bots = BOT_NAMES.map((name, i) => ({ name, color: BOT_COLORS[i], dist: -20 - i * 6, lateral: (i % 2 ? 1 : -1) * (2 + (i >> 1) * 1.6),
      speed: 0, maxSpeed: 27 + Math.random() * 5, lap: 0, finished: 0, noise: Math.random() * 100 }));
    karts = [null, null];
  };
  reset();
  const begin = () => { phase = 'countdown'; startAt = Date.now() + 3500; };
  room.state = () => ({ type: 'state', phase, startAt, now: Date.now(), order, connected: room.players.map(p => !!p), names: room.names, score: room.score,
    karts: karts.map((k, i) => k && { ...k, name: room.names[i] || 'Speler ' + (i + 1) }),
    bots: bots.map(b => ({ name: b.name, color: b.color, dist: b.dist, lateral: b.lateral, lap: b.lap, finished: b.finished })) });
  room.onMessage = (idx, m) => {
    if (m.type === 'start' && phase === 'wait') begin();
    if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) begin(); }
    if (m.type === 'kart') {
      karts[idx] = { x: m.x, z: m.z, rot: m.rot, speed: m.speed, lap: m.lap, dist: m.dist, finished: karts[idx]?.finished || 0 };
      if (m.lap >= TRACK.LAPS && !karts[idx].finished && phase === 'race') { karts[idx].finished = Date.now(); order.push({ name: room.names[idx] || 'Speler ' + (idx + 1), player: idx + 1 }); if (order.length === 1) room.score[idx]++; }
    }
  };
  room.quiet = m => m.type === 'kart';
  room.onJoin = () => { if (room.players[0] && room.players[1] && phase === 'wait') begin(); };
  room.onLeave = () => { reset(); };
  // Bot-simulatie 30 Hz
  setInterval(() => {
    const now = Date.now();
    if (phase === 'countdown' && now >= startAt) phase = 'race';
    if (phase !== 'race') return;
    const dt = 1 / 30; tick++;
    for (const b of bots) {
      if (b.finished) { b.speed = Math.max(0, b.speed - 10 * dt); b.dist += b.speed * dt; continue; }
      const target = b.maxSpeed + Math.sin(now / 1000 + b.noise) * 2;
      b.speed += (target - b.speed) * dt * 0.8;
      b.dist += b.speed * dt;
      b.lap = Math.floor(b.dist / TRACK.LEN);
      // zacht van baan wisselen
      b.lateral += Math.sin(now / 2500 + b.noise) * dt * 0.8;
      b.lateral = Math.max(-5, Math.min(5, b.lateral));
      if (b.lap >= TRACK.LAPS) { b.finished = now; order.push({ name: b.name, bot: true }); }
    }
    if (order.length >= 8 || (karts.every(k => !k || k.finished) && bots.every(b => b.finished))) phase = 'done';
    if (tick % 2 === 0) room.broadcast(); // 15 Hz naar clients
  }, 1000 / 30);
  return room;
}

