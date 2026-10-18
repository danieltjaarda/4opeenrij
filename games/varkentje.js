module.exports = { title: 'Varkentje (dobbel)', icon: '🎲', page: 'varkentje.html', room: mk };
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let total, turnPts, turn, roll, winner, rollId;
  const reset = () => { total = [0, 0]; turnPts = 0; turn = 1; roll = 0; winner = 0; rollId = 0; };
  reset();
  room.state = () => ({ type: 'state', total, turnPts, turn, roll, rollId, winner, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    if (m.type === 'roll') { roll = 1 + Math.floor(Math.random() * 6); rollId++; if (roll === 1) { turnPts = 0; turn = 3 - turn; } else turnPts += roll; }
    if (m.type === 'hold') { total[idx] += turnPts; turnPts = 0; if (total[idx] >= 50) { winner = idx + 1; room.score[idx]++; } else turn = 3 - turn; }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
