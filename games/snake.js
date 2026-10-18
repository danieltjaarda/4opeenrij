module.exports = { title: 'Snake duel', icon: '🐍', page: 'snake.html', room: mk };
const W = 30, H = 22, WIN = 3;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let s, food, phase, startAt, rounds, winner;
  const rndFood = () => { for (let t = 0; t < 200; t++) { const f = [Math.floor(Math.random() * W), Math.floor(Math.random() * H)]; if (!s.some(q => q.body.some(b => b[0] === f[0] && b[1] === f[1]))) return f; } return [0, 0]; };
  const newRound = () => { s = [{ body: [[5, 11], [4, 11], [3, 11]], dx: 1, dy: 0, alive: true, grow: 0 }, { body: [[24, 11], [25, 11], [26, 11]], dx: -1, dy: 0, alive: true, grow: 0 }]; food = []; for (let i = 0; i < 3; i++) food.push(rndFood()); phase = 'countdown'; startAt = Date.now() + 2500; };
  const reset = () => { rounds = [0, 0]; winner = 0; newRound(); phase = 'wait'; };
  reset();
  room.state = () => ({ type: 'state', phase, startAt, now: Date.now(), snakes: s, food, rounds, winner, W, H, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.quiet = m => m.type === 'dir';
  room.onMessage = (idx, m) => { if (m.type === 'dir') { const q = s[idx], [dx, dy] = m.d; if (Math.abs(dx) + Math.abs(dy) !== 1 || (dx === -q.dx && dy === -q.dy)) return; q.ndx = dx; q.ndy = dy; } if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) newRound(); } };
  room.onJoin = () => { if (room.players[0] && room.players[1]) newRound(); };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  setInterval(() => {
    if (phase === 'countdown' && Date.now() >= startAt) phase = 'play';
    if (phase !== 'play') return;
    const heads = [];
    for (const q of s) { if (!q.alive) { heads.push(null); continue; } if (q.ndx !== undefined) { q.dx = q.ndx; q.dy = q.ndy; } const h = [q.body[0][0] + q.dx, q.body[0][1] + q.dy]; heads.push(h); }
    s.forEach((q, i) => { const h = heads[i]; if (!h) return; if (h[0] < 0 || h[0] >= W || h[1] < 0 || h[1] >= H) q.alive = false;
      else if (s.some((o, j) => o.body.some((b, k) => b[0] === h[0] && b[1] === h[1] && !(j === i && k === o.body.length - 1 && !o.grow)))) q.alive = false;
      else if (heads[1 - i] && heads[1 - i][0] === h[0] && heads[1 - i][1] === h[1]) q.alive = false; });
    s.forEach((q, i) => { if (!q.alive) return; q.body.unshift(heads[i]); const fi = food.findIndex(f => f[0] === heads[i][0] && f[1] === heads[i][1]); if (fi >= 0) { food.splice(fi, 1); q.grow += 2; food.push(rndFood()); } if (q.grow > 0) q.grow--; else q.body.pop(); });
    if (!s[0].alive || !s[1].alive) { phase = 'roundover'; if (s[0].alive) rounds[0]++; else if (s[1].alive) rounds[1]++;
      if (rounds[0] >= WIN || rounds[1] >= WIN) { winner = rounds[0] >= WIN ? 1 : 2; room.score[winner - 1]++; phase = 'done'; } else setTimeout(() => { if (phase === 'roundover') { newRound(); room.broadcast(); } }, 1800); }
    room.broadcast();
  }, 1000 / 9);
  return room;
}
