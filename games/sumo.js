module.exports = { title: 'Sumo', icon: '🥋', page: 'sumo.html', room: mk };
const R0 = 9, WIN = 3;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let b, inp, rounds, phase, startAt, radius, winner, last = Date.now();
  const newRound = () => { b = [{ x: -4, z: 0, vx: 0, vz: 0 }, { x: 4, z: 0, vx: 0, vz: 0 }]; radius = R0; phase = 'countdown'; startAt = Date.now() + 2000; };
  const reset = () => { rounds = [0, 0]; winner = 0; inp = [[0, 0], [0, 0]]; newRound(); phase = 'wait'; };
  reset();
  room.state = () => ({ type: 'state', phase, startAt, now: Date.now(), b, radius, rounds, winner, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.quiet = m => m.type === 'input';
  room.onMessage = (idx, m) => { if (m.type === 'input') inp[idx] = [Math.max(-1, Math.min(1, +m.x || 0)), Math.max(-1, Math.min(1, +m.z || 0))]; if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) newRound(); } };
  room.onJoin = () => { if (room.players[0] && room.players[1]) newRound(); };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  setInterval(() => {
    const now = Date.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (phase === 'countdown' && now >= startAt) phase = 'play';
    if (phase !== 'play') return;
    radius = Math.max(3.5, radius - dt * 0.25);
    b.forEach((q, i) => { q.vx += inp[i][0] * 28 * dt; q.vz += inp[i][1] * 28 * dt; q.vx *= 0.96; q.vz *= 0.96; q.x += q.vx * dt; q.z += q.vz * dt; });
    const dx = b[1].x - b[0].x, dz = b[1].z - b[0].z, d = Math.hypot(dx, dz);
    if (d < 2 && d > 0) { const nx = dx / d, nz = dz / d, rel = (b[0].vx - b[1].vx) * nx + (b[0].vz - b[1].vz) * nz; if (rel > 0) { b[0].vx -= rel * nx * 1.1; b[0].vz -= rel * nz * 1.1; b[1].vx += rel * nx * 1.1; b[1].vz += rel * nz * 1.1; } const ov = (2 - d) / 2; b[0].x -= nx * ov; b[0].z -= nz * ov; b[1].x += nx * ov; b[1].z += nz * ov; b.hit = (b.hit || 0) + 1; }
    const out = b.map(q => Math.hypot(q.x, q.z) > radius + 0.5);
    if (out[0] || out[1]) { phase = 'roundover'; if (out[0] && !out[1]) rounds[1]++; else if (out[1] && !out[0]) rounds[0]++;
      if (rounds[0] >= WIN || rounds[1] >= WIN) { winner = rounds[0] >= WIN ? 1 : 2; room.score[winner - 1]++; phase = 'done'; }
      else setTimeout(() => { if (phase === 'roundover') { newRound(); room.broadcast(); } }, 1500); }
    room.broadcast();
  }, 1000 / 30);
  return room;
}
