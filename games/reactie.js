module.exports = { title: 'Reactieduel', icon: '⚡', page: 'reactie.html', room: mk };
const WIN = 5;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let phase, goAt, pts, winner, result, timer;
  const arm = () => { phase = 'wait'; goAt = Date.now() + 1500 + Math.random() * 4000; result = null; clearTimeout(timer); timer = setTimeout(() => { if (phase === 'wait') { phase = 'go'; room.broadcast(); } }, goAt - Date.now()); };
  const reset = () => { pts = [0, 0]; winner = 0; phase = 'idle'; result = null; clearTimeout(timer); };
  reset();
  room.state = () => ({ type: 'state', phase, goAt, now: Date.now(), pts, winner, result, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onJoin = () => { if (room.players[0] && room.players[1]) arm(); };
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) arm(); return; }
    if (m.type !== 'tap' || winner || !room.players[0] || !room.players[1]) return;
    if (phase === 'wait') { result = { loser: idx + 1, early: true }; pts[1 - idx]++; phase = 'result'; }
    else if (phase === 'go') { result = { winnerTap: idx + 1, ms: Date.now() - goAt }; pts[idx]++; phase = 'result'; }
    else return;
    if (pts[0] >= WIN || pts[1] >= WIN) { winner = pts[0] >= WIN ? 1 : 2; room.score[winner - 1]++; } else setTimeout(() => { if (phase === 'result' && !winner) { arm(); room.broadcast(); } }, 2000);
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
