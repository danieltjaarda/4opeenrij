module.exports = { title: 'Zeeslag', icon: '🚢', page: 'zeeslag.html', room: mk };
const SHIPS = [5, 4, 3, 3, 2];
function place() { for (let tries = 0; tries < 1000; tries++) { const g = Array(100).fill(0), ships = []; let ok = true;
  for (let s = 0; s < SHIPS.length && ok; s++) { const L = SHIPS[s]; let placed = false;
    for (let t = 0; t < 200 && !placed; t++) { const h = Math.random() < 0.5, r = Math.floor(Math.random() * (h ? 10 : 10 - L + 1)), c = Math.floor(Math.random() * (h ? 10 - L + 1 : 10)); const cells = [];
      for (let k = 0; k < L; k++) cells.push(h ? r * 10 + c + k : (r + k) * 10 + c);
      if (cells.every(i => !g[i] && [-1, 1, -10, 10, -11, -9, 9, 11].every(d => { const j = i + d; return j < 0 || j > 99 || Math.abs((j % 10) - (i % 10)) > 1 || !g[j]; }))) { cells.forEach(i => g[i] = s + 1); ships.push({ cells, len: L }); placed = true; } }
    if (!placed) ok = false; }
  if (ok) return { grid: g, ships }; } }
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let boards, shots, ready, turn, winner, lastShot;
  const reset = () => { boards = [place(), place()]; shots = [Array(100).fill(0), Array(100).fill(0)]; ready = [false, false]; turn = 1; winner = 0; lastShot = null; };
  reset();
  const sendMine = () => room.players.forEach((p, i) => p && p.readyState === 1 && p.send(JSON.stringify({ type: 'mine', grid: boards[i].grid })));
  const sunkList = i => boards[i].ships.filter(s => s.cells.every(c => shots[1 - i][c])).map(s => s.cells);
  room.state = () => ({ type: 'state', phase: winner ? 'done' : ready[0] && ready[1] ? 'play' : 'setup', ready, turn, winner, shots, sunk: [sunkList(0), sunkList(1)], lastShot, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onJoin = () => sendMine();
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { reset(); sendMine(); return; }
    if (m.type === 'shuffle' && !ready[idx]) { boards[idx] = place(); sendMine(); }
    if (m.type === 'ready') ready[idx] = true;
    if (m.type === 'fire' && ready[0] && ready[1] && !winner && turn === idx + 1 && m.i >= 0 && m.i < 100 && !shots[idx][m.i]) {
      const hit = boards[1 - idx].grid[m.i] > 0; shots[idx][m.i] = hit ? 2 : 1; lastShot = { i: m.i, hit, by: idx + 1 };
      if (boards[1 - idx].ships.every(s => s.cells.every(c => shots[idx][c]))) { winner = idx + 1; room.score[idx]++; }
      else if (!hit) turn = 3 - turn; }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
