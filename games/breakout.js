module.exports = { title: 'Breakout duel', icon: '🧱', page: 'breakout.html', room: mk };
const W = 12, H = 16, COLS = 8, ROWS = 5, PAD = 2.4;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let g, phase, winner, last = Date.now();
  const side = () => ({ bricks: Array(COLS * ROWS).fill(1), ball: { x: 0, z: 3, vx: 3, vz: -9 }, pad: 0, tgt: 0, left: COLS * ROWS, lives: 3, hit: 0 });
  const reset = () => { g = [side(), side()]; phase = 'wait'; winner = 0; };
  reset();
  room.state = () => ({ type: 'state', phase, winner, sides: g, W, H, COLS, ROWS, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.quiet = m => m.type === 'pad';
  room.onMessage = (idx, m) => { if (m.type === 'pad') g[idx].tgt = Math.max(-W/2 + PAD/2, Math.min(W/2 - PAD/2, +m.x || 0)); if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) phase = 'play'; } };
  room.onJoin = () => { if (room.players[0] && room.players[1]) phase = 'play'; };
  room.onLeave = () => reset();
  setInterval(() => {
    const now = Date.now(), dt = Math.min(0.04, (now - last) / 1000); last = now;
    g.forEach(s => s.pad += (s.tgt - s.pad) * Math.min(1, dt * 20));
    if (phase !== 'play') return;
    g.forEach((s, i) => { if (!s.lives || !s.left) return; const b = s.ball; b.x += b.vx * dt; b.z += b.vz * dt;
      if (b.x > W/2 - 0.3) { b.x = W/2 - 0.3; b.vx = -Math.abs(b.vx); } if (b.x < -W/2 + 0.3) { b.x = -W/2 + 0.3; b.vx = Math.abs(b.vx); } if (b.z < -H/2 + 0.3) { b.z = -H/2 + 0.3; b.vz = Math.abs(b.vz); }
      // paddle bij z = H/2 - 1
      if (b.vz > 0 && b.z > H/2 - 1.3 && b.z < H/2 - 0.7 && Math.abs(b.x - s.pad) < PAD/2 + 0.3) { b.z = H/2 - 1.3; const rel = (b.x - s.pad) / (PAD/2); const sp = Math.min(16, Math.hypot(b.vx, b.vz) * 1.03); const ang = rel * 1.1; b.vx = Math.sin(ang) * sp; b.vz = -Math.cos(ang) * sp; s.hit++; }
      if (b.z > H/2 + 1) { s.lives--; s.ball = { x: 0, z: 3, vx: 3 * (Math.random() < 0.5 ? 1 : -1), vz: -9 }; }
      // stenen: rij 0 bovenaan z=-H/2+1, breedte W/COLS
      const bw = W / COLS, bh = 0.7; const c = Math.floor((b.x + W/2) / bw), r = Math.floor((b.z - (-H/2 + 1)) / bh);
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS && s.bricks[r * COLS + c]) { s.bricks[r * COLS + c] = 0; s.left--; s.hit++; const cx = -W/2 + (c + 0.5) * bw, cz = -H/2 + 1 + (r + 0.5) * bh; if (Math.abs(b.x - cx) / bw > Math.abs(b.z - cz) / bh) b.vx = -b.vx; else b.vz = -b.vz; } });
    if (g[0].left === 0 || g[1].left === 0 || !g[0].lives || !g[1].lives) { winner = g[0].left === 0 ? 1 : g[1].left === 0 ? 2 : !g[0].lives && !g[1].lives ? 3 : !g[0].lives ? 2 : 1; if (winner < 3) room.score[winner - 1]++; phase = 'done'; }
    room.broadcast();
  }, 1000 / 30);
  return room;
}
