module.exports = { title: '4 op een rij 3D (4×4×4)', icon: '🧊', page: 'qubic.html', room: mk };
const LINES = []; (() => { const idx = (x, y, z) => x + y * 4 + z * 16; const dirs = []; for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) for (const dz of [-1, 0, 1]) if (dx || dy || dz) dirs.push([dx, dy, dz]);
  const seen = new Set(); for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) for (let z = 0; z < 4; z++) for (const [dx, dy, dz] of dirs) { const l = []; for (let k = 0; k < 4; k++) { const X = x + dx * k, Y = y + dy * k, Z = z + dz * k; if (X < 0 || X > 3 || Y < 0 || Y > 3 || Z < 0 || Z > 3) break; l.push(idx(X, Y, Z)); }
    if (l.length === 4) { const key = [...l].sort((a, b) => a - b).join(','); if (!seen.has(key)) { seen.add(key); LINES.push(l); } } } })();
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let board, turn, winner, winLine, last, starter = 1;
  const reset = () => { board = Array(64).fill(0); turn = starter; winner = 0; winLine = null; last = null; };
  reset();
  room.state = () => ({ type: 'state', board, turn, winner, winLine, last, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { starter = 3 - starter; return reset(); }
    if (m.type !== 'place' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const x = m.x | 0, z = m.z | 0; if (x < 0 || x > 3 || z < 0 || z > 3) return;
    let y = 0; while (y < 4 && board[x + y * 4 + z * 16]) y++; if (y === 4) return; // zwaartekracht: stapelen
    const i = x + y * 4 + z * 16; board[i] = turn; last = i;
    const l = LINES.find(l => l.every(k => board[k] === turn)); if (l) { winner = turn; winLine = l; room.score[turn - 1]++; } else if (board.every(v => v)) winner = 3; else turn = 3 - turn;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
