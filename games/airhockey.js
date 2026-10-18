module.exports = { title: 'Airhockey', icon: '🏒', page: 'airhockey.html', room: mk };
const W = 16, H = 26, GOAL = 5, WIN = 5, PR = 1.1, BR = 0.7;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let puck, pad, tgt, pts, phase, winner, serveAt, last = Date.now();
  const serve = () => { puck = { x: 0, z: 0, vx: 0, vz: 0, hit: 0 }; serveAt = Date.now() + 1000; };
  const reset = () => { pad = [{ x: 0, z: -H/2 + 3, vx: 0, vz: 0 }, { x: 0, z: H/2 - 3, vx: 0, vz: 0 }]; tgt = [{ x: 0, z: -H/2 + 3 }, { x: 0, z: H/2 - 3 }]; pts = [0, 0]; winner = 0; phase = 'wait'; serve(); };
  reset();
  room.state = () => ({ type: 'state', phase, puck, pad, pts, winner, serveAt, now: Date.now(), names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.quiet = m => m.type === 'pad';
  room.onMessage = (idx, m) => {
    if (m.type === 'pad') { const zmin = idx === 0 ? -H/2 + PR : 0.2 + PR, zmax = idx === 0 ? -0.2 - PR : H/2 - PR; tgt[idx] = { x: Math.max(-W/2 + PR, Math.min(W/2 - PR, +m.x || 0)), z: Math.max(zmin, Math.min(zmax, +m.z || 0)) }; }
    if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) phase = 'play'; }
  };
  room.onJoin = () => { if (room.players[0] && room.players[1]) phase = 'play'; };
  room.onLeave = () => reset();
  setInterval(() => {
    const now = Date.now(), dt = Math.min(0.04, (now - last) / 1000); last = now;
    for (let i = 0; i < 2; i++) { const p = pad[i], nx = p.x + (tgt[i].x - p.x) * Math.min(1, dt * 22), nz = p.z + (tgt[i].z - p.z) * Math.min(1, dt * 22); p.vx = (nx - p.x) / dt; p.vz = (nz - p.z) / dt; p.x = nx; p.z = nz; }
    if (phase !== 'play') return;
    if (now >= serveAt) {
      puck.x += puck.vx * dt; puck.z += puck.vz * dt; puck.vx *= 0.995; puck.vz *= 0.995;
      if (puck.x > W/2 - BR) { puck.x = W/2 - BR; puck.vx = -Math.abs(puck.vx) * 0.9; puck.hit++; } if (puck.x < -W/2 + BR) { puck.x = -W/2 + BR; puck.vx = Math.abs(puck.vx) * 0.9; puck.hit++; }
      const inGoal = Math.abs(puck.x) < GOAL / 2;
      if (puck.z > H/2 - BR && !inGoal) { puck.z = H/2 - BR; puck.vz = -Math.abs(puck.vz) * 0.9; puck.hit++; } if (puck.z < -H/2 + BR && !inGoal) { puck.z = -H/2 + BR; puck.vz = Math.abs(puck.vz) * 0.9; puck.hit++; }
      for (const p of pad) { const dx = puck.x - p.x, dz = puck.z - p.z, d = Math.hypot(dx, dz); if (d < PR + BR && d > 0) { const nx = dx / d, nz = dz / d; puck.x = p.x + nx * (PR + BR); puck.z = p.z + nz * (PR + BR);
        const rel = (puck.vx - p.vx) * nx + (puck.vz - p.vz) * nz; if (rel < 0) { puck.vx -= 1.8 * rel * nx; puck.vz -= 1.8 * rel * nz; } puck.vx += p.vx * 0.3; puck.vz += p.vz * 0.3;
        const sp = Math.hypot(puck.vx, puck.vz); if (sp > 40) { puck.vx *= 40 / sp; puck.vz *= 40 / sp; } puck.hit++; } }
      if (puck.z > H/2 + 1) { pts[0]++; if (pts[0] >= WIN) { winner = 1; phase = 'done'; room.score[0]++; } else serve(); }
      if (puck.z < -H/2 - 1) { pts[1]++; if (pts[1] >= WIN) { winner = 2; phase = 'done'; room.score[1]++; } else serve(); }
    }
    room.broadcast();
  }, 1000 / 30);
  return room;
}
