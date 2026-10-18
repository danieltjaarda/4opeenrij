module.exports = { title: 'Tron', icon: '🏍️', page: 'tron.html', room: mk };
const W = 60, H = 40, WIN = 3;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let p, phase, startAt, rounds, winner, grid;
  const reset = () => { rounds = [0, 0]; winner = 0; newRound(); phase = 'wait'; };
  const newRound = () => { grid = new Uint8Array(W * H); p = [{ x: 10, y: 20, dx: 1, dy: 0, alive: true, trail: [] }, { x: 49, y: 20, dx: -1, dy: 0, alive: true, trail: [] }]; p.forEach((q, i) => { grid[q.y * W + q.x] = i + 1; q.trail.push([q.x, q.y]); }); phase = 'countdown'; startAt = Date.now() + 2500; };
  reset();
  room.state = () => ({ type: 'state', phase, startAt, now: Date.now(), players: p, rounds, winner, W, H, names: room.names, score: room.score, connected: room.players.map(q => !!q) });
  room.quiet = m => m.type === 'dir';
  room.onMessage = (idx, m) => {
    if (m.type === 'dir') { const q = p[idx]; const [dx, dy] = m.d; if (Math.abs(dx) + Math.abs(dy) !== 1) return; if (dx === -q.dx && dy === -q.dy) return; q.ndx = dx; q.ndy = dy; }
    if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) newRound(); }
  };
  room.onJoin = () => { if (room.players[0] && room.players[1]) newRound(); };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  setInterval(() => {
    if (phase === 'countdown' && Date.now() >= startAt) phase = 'play';
    if (phase !== 'play') return;
    for (const q of p) { if (!q.alive) continue; if (q.ndx !== undefined) { q.dx = q.ndx; q.dy = q.ndy; } q.x += q.dx; q.y += q.dy;
      if (q.x < 0 || q.x >= W || q.y < 0 || q.y >= H || grid[q.y * W + q.x]) q.alive = false; }
    // beide op hetzelfde vakje
    if (p[0].alive && p[1].alive && p[0].x === p[1].x && p[0].y === p[1].y) p[0].alive = p[1].alive = false;
    p.forEach((q, i) => { if (q.alive) { grid[q.y * W + q.x] = i + 1; q.trail.push([q.x, q.y]); } });
    if (!p[0].alive || !p[1].alive) { phase = 'roundover';
      if (p[0].alive) rounds[0]++; else if (p[1].alive) rounds[1]++;
      if (rounds[0] >= WIN || rounds[1] >= WIN) { winner = rounds[0] >= WIN ? 1 : 2; room.score[winner - 1]++; phase = 'done'; }
      else setTimeout(() => { if (phase === 'roundover') { newRound(); room.broadcast(); } }, 1800); }
    room.broadcast();
  }, 1000 / 14);
  return room;
}
