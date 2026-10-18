module.exports = { title: 'Ruimteduel', icon: '🚀', page: 'asteroids.html', room: mk };
const W = 60, H = 40, WIN = 5;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let ships, bullets, rocks, inp, pts, phase, winner, last = Date.now(), nid = 1;
  const spawnRocks = () => { rocks = []; for (let i = 0; i < 6; i++) rocks.push({ id: nid++, x: (Math.random() - 0.5) * W, z: (Math.random() - 0.5) * H * 0.5, vx: (Math.random() - 0.5) * 4, vz: (Math.random() - 0.5) * 4, r: 2 + Math.random() * 1.5, spin: Math.random() * 2 }); };
  const newShip = i => ({ x: i ? W/3 : -W/3, z: 0, vx: 0, vz: 0, a: i ? Math.PI : 0, cool: 0, dead: 0 });
  const reset = () => { ships = [newShip(0), newShip(1)]; bullets = []; spawnRocks(); inp = [{}, {}]; pts = [0, 0]; phase = 'wait'; winner = 0; };
  reset();
  room.state = () => ({ type: 'state', phase, winner, ships, bullets, rocks, pts, W, H, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.quiet = m => m.type === 'input';
  room.onMessage = (idx, m) => { if (m.type === 'input') inp[idx] = m; if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) phase = 'play'; } };
  room.onJoin = () => { if (room.players[0] && room.players[1]) phase = 'play'; };
  room.onLeave = () => reset();
  const wrap = o => { if (o.x > W/2) o.x -= W; if (o.x < -W/2) o.x += W; if (o.z > H/2) o.z -= H; if (o.z < -H/2) o.z += H; };
  setInterval(() => {
    const now = Date.now(), dt = Math.min(0.04, (now - last) / 1000); last = now; if (phase !== 'play') return;
    ships.forEach((s, i) => { if (s.dead) { if (now > s.dead) { Object.assign(s, newShip(i)); } return; } const k = inp[i]; if (k.l) s.a -= 3.5 * dt; if (k.r) s.a += 3.5 * dt; if (typeof k.aim === 'number' && Number.isFinite(k.aim)) { const d = ((k.aim - s.a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; s.a += Math.max(-8 * dt, Math.min(8 * dt, d)); } if (k.t) { s.vx += Math.sin(s.a) * 22 * dt; s.vz += Math.cos(s.a) * 22 * dt; }
      s.vx *= 0.99; s.vz *= 0.99; const sp = Math.hypot(s.vx, s.vz); if (sp > 20) { s.vx *= 20 / sp; s.vz *= 20 / sp; } s.x += s.vx * dt; s.z += s.vz * dt; wrap(s); s.cool -= dt;
      if (k.f && s.cool <= 0) { s.cool = 0.25; bullets.push({ id: nid++, x: s.x + Math.sin(s.a) * 1.5, z: s.z + Math.cos(s.a) * 1.5, vx: s.vx + Math.sin(s.a) * 35, vz: s.vz + Math.cos(s.a) * 35, life: 1.4, owner: i }); } });
    rocks.forEach(r => { r.x += r.vx * dt; r.z += r.vz * dt; wrap(r); });
    for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; b.x += b.vx * dt; b.z += b.vz * dt; b.life -= dt; wrap(b); if (b.life <= 0) { bullets.splice(i, 1); continue; }
      const t = ships[1 - b.owner]; if (!t.dead && Math.hypot(t.x - b.x, t.z - b.z) < 1.3) { t.dead = now + 2000; pts[b.owner]++; bullets.splice(i, 1); continue; }
      const ri = rocks.findIndex(r => Math.hypot(r.x - b.x, r.z - b.z) < r.r); if (ri >= 0) { const r = rocks[ri]; rocks.splice(ri, 1); bullets.splice(i, 1); if (r.r > 1.4) for (let k = 0; k < 2; k++) rocks.push({ id: nid++, x: r.x, z: r.z, vx: (Math.random() - 0.5) * 8, vz: (Math.random() - 0.5) * 8, r: r.r * 0.6, spin: Math.random() * 3 }); if (rocks.length < 3) rocks.push({ id: nid++, x: -W/2, z: (Math.random() - 0.5) * H, vx: 3, vz: (Math.random() - 0.5) * 3, r: 2.5, spin: 1 }); } }
    ships.forEach((s, i) => { if (s.dead) return; if (rocks.some(r => Math.hypot(r.x - s.x, r.z - s.z) < r.r + 0.8)) { s.dead = now + 2000; pts[1 - i]++; } });
    if (pts[0] >= WIN || pts[1] >= WIN) { winner = pts[0] >= WIN ? 1 : 2; room.score[winner - 1]++; phase = 'done'; }
    room.broadcast();
  }, 1000 / 30);
  return room;
}
