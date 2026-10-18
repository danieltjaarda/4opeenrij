module.exports = { title: 'Lucifers (Nim)', icon: '🔥', page: 'nim.html', room: mk };
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let rows, turn, winner, starter = 1, last;
  const reset = () => { rows = [3, 5, 7]; turn = starter; winner = 0; last = null; };
  reset();
  room.state = () => ({ type: 'state', rows, turn, winner, last, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { starter = 3 - starter; return reset(); }
    if (m.type !== 'take' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const r = m.row | 0, n = m.n | 0; if (r < 0 || r > 2 || n < 1 || n > rows[r]) return;
    rows[r] -= n; last = { row: r, n, by: turn };
    if (rows.every(v => !v)) { winner = 3 - turn; room.score[winner - 1]++; } // wie de laatste pakt verliest
    else turn = 3 - turn;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
