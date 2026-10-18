module.exports = { title: 'Mancala', icon: '🫘', page: 'mancala.html', room: mk };
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let pits, turn, winner, last;
  // pits 0-5 speler 1, 6 = kalaha 1, 7-12 speler 2, 13 = kalaha 2
  const reset = () => { pits = Array(14).fill(4); pits[6] = 0; pits[13] = 0; turn = 1; winner = 0; last = null; };
  reset();
  room.state = () => ({ type: 'state', pits, turn, winner, last, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'pick' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const i = m.i | 0, mine = idx === 0 ? [0, 5] : [7, 12], store = idx === 0 ? 6 : 13, other = idx === 0 ? 13 : 6; if (i < mine[0] || i > mine[1] || !pits[i]) return;
    let n = pits[i], p = i; pits[i] = 0; const path = [];
    while (n) { p = (p + 1) % 14; if (p === other) continue; pits[p]++; n--; path.push(p); }
    let again = p === store;
    if (!again && p >= mine[0] && p <= mine[1] && pits[p] === 1) { const opp = 12 - p; if (pits[opp]) { pits[store] += pits[opp] + 1; pits[opp] = 0; pits[p] = 0; } }
    last = { from: i, path, by: turn };
    const s1 = pits.slice(0, 6).reduce((a, b) => a + b, 0), s2 = pits.slice(7, 13).reduce((a, b) => a + b, 0);
    if (!s1 || !s2) { pits[6] += s1; pits[13] += s2; for (let k = 0; k < 14; k++) if (k !== 6 && k !== 13) pits[k] = 0; winner = pits[6] > pits[13] ? 1 : pits[13] > pits[6] ? 2 : 3; if (winner < 3) room.score[winner - 1]++; }
    else if (!again) turn = 3 - turn;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
