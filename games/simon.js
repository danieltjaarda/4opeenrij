module.exports = { title: 'Simon (geheugen)', icon: '🎵', page: 'simon.html', room: mk };
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let seq, turn, pos, phase, winner, seqId;
  const reset = () => { seq = [Math.floor(Math.random() * 4)]; turn = 1; pos = 0; phase = 'show'; winner = 0; seqId = 1; };
  reset();
  room.state = () => ({ type: 'state', seq, turn, pos, phase, winner, seqId, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type === 'seen' && phase === 'show' && turn === idx + 1) { phase = 'input'; pos = 0; return; }
    if (m.type !== 'press' || winner || phase !== 'input' || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    if ((m.c | 0) !== seq[pos]) { winner = 2 - idx; room.score[winner - 1]++; phase = 'done'; return; }
    pos++; if (pos >= seq.length) { seq.push(Math.floor(Math.random() * 4)); turn = 3 - turn; pos = 0; phase = 'show'; seqId++; }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
