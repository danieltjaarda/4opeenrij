module.exports = { title: 'Mijnenveger race', icon: '💣', page: 'mijnen.html', room: mk };
const W = 12, H = 10, MINES = 16;
function gen() { const m = Array(W * H).fill(0); let n = 0; while (n < MINES) { const i = Math.floor(Math.random() * W * H); if (!m[i]) { m[i] = 1; n++; } }
  const num = m.map((v, i) => { if (v) return 9; const x = i % W, y = Math.floor(i / W); let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && X < W && Y >= 0 && Y < H && m[Y * W + X]) c++; } return c; }); return num; }
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let field, open, flags, dead, winner;
  const reset = () => { field = gen(); open = [Array(W * H).fill(0), Array(W * H).fill(0)]; flags = [Array(W * H).fill(0), Array(W * H).fill(0)]; dead = [false, false]; winner = 0; };
  reset();
  const view = i => field.map((v, k) => open[i][k] ? v : null);
  room.state = () => ({ type: 'state', W, H, views: [view(0), view(1)], flags, dead, winner, opened: open.map(o => o.filter(Boolean).length), field: winner ? field : null, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  const reveal = (i, k) => { if (open[i][k] || flags[i][k]) return; open[i][k] = 1; if (field[k] === 0) { const x = k % W, y = Math.floor(k / W); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && X < W && Y >= 0 && Y < H) reveal(i, Y * W + X); } } };
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (winner || dead[idx] || !room.players[0] || !room.players[1]) return; const k = m.i | 0; if (k < 0 || k >= W * H) return;
    if (m.type === 'flag') { if (!open[idx][k]) flags[idx][k] = flags[idx][k] ? 0 : 1; }
    if (m.type === 'open') { if (flags[idx][k] || open[idx][k]) return; if (field[k] === 9) { dead[idx] = true; open[idx][k] = 1; if (dead[1 - idx]) winner = 3; else { winner = 2 - idx; room.score[winner - 1]++; } return; } reveal(idx, k);
      if (open[idx].filter(Boolean).length === W * H - MINES) { winner = idx + 1; room.score[idx]++; } }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
