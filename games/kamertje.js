module.exports = { title: 'Kamertje verhuren', icon: '📦', page: 'kamertje.html', room: mk };
const N = 5; // 5x5 punten → 4x4 hokjes
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let hl, vl, boxes, turn, winner, cnt, last;
  const reset = () => { hl = Array(N * (N - 1)).fill(0); vl = Array((N - 1) * N).fill(0); boxes = Array((N - 1) * (N - 1)).fill(0); turn = 1; winner = 0; cnt = [0, 0]; last = null; };
  reset();
  // hl[r*(N-1)+c]: horizontale lijn van punt (r,c) naar (r,c+1); vl[r*N+c]: verticale lijn van (r,c) naar (r+1,c)
  room.state = () => ({ type: 'state', N, hl, vl, boxes, turn, winner, cnt, last, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'line' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const arr = m.h ? hl : vl, i = m.i | 0; if (i < 0 || i >= arr.length || arr[i]) return; arr[i] = turn; last = { h: !!m.h, i };
    let made = 0; for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) { const b = r * (N - 1) + c; if (boxes[b]) continue;
      if (hl[r * (N - 1) + c] && hl[(r + 1) * (N - 1) + c] && vl[r * N + c] && vl[r * N + c + 1]) { boxes[b] = turn; cnt[turn - 1]++; made++; } }
    if (boxes.every(v => v)) { winner = cnt[0] > cnt[1] ? 1 : cnt[1] > cnt[0] ? 2 : 3; if (winner < 3) room.score[winner - 1]++; } else if (!made) turn = 3 - turn;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
