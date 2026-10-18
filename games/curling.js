module.exports = { title: 'Curling', icon: '🥌', page: 'curling.html', room: mk };
const LEN = 40, WID = 10, PER = 4;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let stones, turn, thrown, winner, moving, result, last = Date.now();
  const reset = () => { stones = []; turn = 1; thrown = [0, 0]; winner = 0; moving = false; result = null; };
  reset();
  room.state = () => ({ type: 'state', stones, turn, thrown, winner, moving, result, LEN, WID, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'throw' || winner || moving || turn !== idx + 1 || thrown[idx] >= PER || !room.players[0] || !room.players[1]) return;
    const ang = Math.max(-0.35, Math.min(0.35, +m.ang || 0)), pow = Math.max(8, Math.min(26, +m.pow || 15)), curl = Math.max(-1, Math.min(1, +m.curl || 0));
    stones.push({ id: stones.length, x: 0, z: 0, vx: Math.sin(ang) * pow, vz: Math.cos(ang) * pow, by: idx + 1, curl }); thrown[idx]++; moving = true;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  setInterval(() => {
    const now = Date.now(), dt = Math.min(0.04, (now - last) / 1000); last = now; if (!moving) return;
    let any = false;
    for (const s of stones) { const sp = Math.hypot(s.vx, s.vz); if (sp < 0.05) { s.vx = s.vz = 0; continue; } any = true; const f = 1.6 * dt; const k = Math.max(0, sp - f) / sp; s.vx *= k; s.vz *= k; s.vx += s.curl * 0.6 * dt * (sp / 15); s.x += s.vx * dt; s.z += s.vz * dt;
      if (Math.abs(s.x) > WID/2 - 0.5) { s.x = Math.sign(s.x) * (WID/2 - 0.5); s.vx *= -0.5; } }
    for (let i = 0; i < stones.length; i++) for (let j = i + 1; j < stones.length; j++) { const a = stones[i], b = stones[j]; const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz); if (d < 1 && d > 0) { const nx = dx / d, nz = dz / d, rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz; if (rel > 0) { a.vx -= rel * nx; a.vz -= rel * nz; b.vx += rel * nx; b.vz += rel * nz; } const ov = (1 - d) / 2; a.x -= nx * ov; a.z -= nz * ov; b.x += nx * ov; b.z += nz * ov; any = true; } }
    stones = stones.filter(s => s.z < LEN + 3 && s.z > -2);
    if (!any) { moving = false; if (thrown[0] >= PER && thrown[1] >= PER) { const tx = 0, tz = LEN - 6; const d = s => Math.hypot(s.x - tx, s.z - tz); const sorted = [...stones].filter(s => d(s) < 4).sort((a, b) => d(a) - d(b)); if (!sorted.length) { winner = 3; result = { pts: 0, by: 0 }; } else { const by = sorted[0].by; let pts = 0; for (const s of sorted) { if (s.by === by) pts++; else break; } result = { pts, by }; winner = by; room.score[by - 1]++; } } else turn = 3 - turn; }
    room.broadcast();
  }, 1000 / 30);
  return room;
}
