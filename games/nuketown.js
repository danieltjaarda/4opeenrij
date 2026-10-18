const M = require('../nuketown-map.js');
module.exports = { title: 'Nuketown', icon: '🎯', page: 'nuketown.html', room: mk, files: { '/nuketown-map.js': 'nuketown-map.js' } };
const WIN = 5, RELOAD = 1400, RESPAWN = 3000, DMG = { head: 100, body: 60 }, HEAL = 50, PICKUP_RESPAWN = 20000;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] };
  let p, kills, winner, phase, startAt, events, evId, pickups;
  const spawn = i => { const s = M.spawns[i]; return { x: s[0], y: s[1], z: s[2], yaw: s[3], pitch: 0, hp: 100, dead: 0, scoped: false, crouch: false, reloadAt: 0 }; };
  const resetPickups = () => { pickups = M.pickups.map(([x, z]) => ({ x, z, at: 0 })); };
  const reset = () => { p = [spawn(0), spawn(1)]; kills = [0, 0]; winner = 0; phase = 'wait'; startAt = 0; events = []; evId = 0; resetPickups(); };
  reset();
  const begin = () => { p = [spawn(0), spawn(1)]; kills = [0, 0]; winner = 0; phase = 'countdown'; startAt = Date.now() + 3000; resetPickups(); };
  const ev = e => { e.id = ++evId; e.at = Date.now(); events.push(e); if (events.length > 12) events.shift(); };
  room.state = () => ({ type: 'state', phase, startAt, now: Date.now(), p, kills, winner, names: room.names, score: room.score, connected: room.players.map(q => !!q), ev: events, pickups: pickups.map(k => ({ x: k.x, z: k.z, up: k.at <= Date.now() })) });
  room.quiet = m => m.type === 'pos';
  room.onJoin = () => { if (room.players[0] && room.players[1]) begin(); };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  room.onMessage = (idx, m) => {
    const me = p[idx], now = Date.now();
    if (m.type === 'reset') { if (room.players[0] && room.players[1]) begin(); else reset(); return; }
    if (phase === 'wait' || phase === 'done') return;
    if (m.type === 'pos') {
      if (me.dead) return;
      const n = v => Number.isFinite(+v) ? +v : 0;
      me.x = Math.max(-M.bounds.x, Math.min(M.bounds.x, n(m.x))); me.z = Math.max(-M.bounds.z, Math.min(M.bounds.z, n(m.z))); me.y = Math.max(-3, Math.min(12, n(m.y)));
      me.yaw = n(m.yaw); me.pitch = Math.max(-1.5, Math.min(1.5, n(m.pitch))); me.scoped = !!m.scoped; me.crouch = !!m.crouch;
    }
    if (m.type === 'shoot') {
      if (phase !== 'play' || me.dead || now < me.reloadAt) return;
      me.reloadAt = now + RELOAD;
      const o = { x: me.x, y: me.y + M.eyeOf(me), z: me.z }, d = M.dirFrom(me.yaw, me.pitch);
      const tMap = M.raycast(o, d), other = p[1 - idx], ph = other.dead ? null : M.rayPlayer(o, d, other);
      let part = 'miss', t = Math.min(tMap, 200);
      if (ph && ph.t < tMap) { part = ph.part; t = ph.t; other.hp = Math.max(0, other.hp - DMG[part]); }
      ev({ type: 'shot', by: idx + 1, o, d, t, part });
      if (part !== 'miss' && other.hp <= 0) {
        other.dead = now + RESPAWN; kills[idx]++; ev({ type: 'kill', by: idx + 1, part });
        if (kills[idx] >= WIN) { winner = idx + 1; room.score[idx]++; phase = 'done'; }
      }
    }
  };
  setInterval(() => {
    if (!room.players[0] && !room.players[1]) return;
    const now = Date.now();
    if (phase === 'countdown' && now >= startAt) phase = 'play';
    p.forEach((q, i) => { if (q.dead && now >= q.dead && phase === 'play') { Object.assign(q, spawn(i)); ev({ type: 'spawn', who: i + 1 }); } });
    if (phase === 'play') for (const k of pickups) { if (k.at > now) continue; p.forEach((q, i) => { if (!q.dead && q.hp < 100 && k.at <= now && Math.hypot(q.x - k.x, q.z - k.z) < 1.1 && q.y < 1.5) { q.hp = Math.min(100, q.hp + HEAL); k.at = now + PICKUP_RESPAWN; ev({ type: 'heal', who: i + 1 }); } }); }
    room.broadcast();
  }, 1000 / 30);
  return room;
}
