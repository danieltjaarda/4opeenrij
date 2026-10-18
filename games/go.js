module.exports = { title: 'Go (9×9)', icon: '⚫', page: 'go.html', room: mk };
const N = 9;
const nb = i => { const r = Math.floor(i / N), c = i % N, o = []; if (r) o.push(i - N); if (r < N - 1) o.push(i + N); if (c) o.push(i - 1); if (c < N - 1) o.push(i + 1); return o; };
function group(b, i) { const col = b[i], seen = new Set([i]), st = [i], libs = new Set(); while (st.length) { const k = st.pop(); for (const j of nb(k)) { if (b[j] === 0) libs.add(j); else if (b[j] === col && !seen.has(j)) { seen.add(j); st.push(j); } } } return { stones: [...seen], libs: libs.size }; }
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let b, turn, winner, passes, caps, ko, last, result;
  const reset = () => { b = Array(N * N).fill(0); turn = 1; winner = 0; passes = 0; caps = [0, 0]; ko = -1; last = -1; result = null; };
  reset();
  const scoreGame = () => { const terr = [0, 0]; const seen = new Set(); for (let i = 0; i < N * N; i++) { if (b[i] || seen.has(i)) continue; const reg = [i], st = [i]; seen.add(i); const touch = new Set(); while (st.length) { const k = st.pop(); for (const j of nb(k)) { if (b[j]) touch.add(b[j]); else if (!seen.has(j)) { seen.add(j); reg.push(j); st.push(j); } } } if (touch.size === 1) terr[[...touch][0] - 1] += reg.length; }
    const s1 = terr[0] + b.filter(v => v === 1).length, s2 = terr[1] + b.filter(v => v === 2).length + 6.5; result = { s1, s2: +s2.toFixed(1) }; winner = s1 > s2 ? 1 : 2; room.score[winner - 1]++; };
  room.state = () => ({ type: 'state', N, board: b, turn, winner, caps, last, passes, result, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    if (m.type === 'pass') { passes++; last = -1; ko = -1; if (passes >= 2) scoreGame(); else turn = 3 - turn; return; }
    if (m.type !== 'place') return; const i = m.i | 0; if (i < 0 || i >= N * N || b[i] || i === ko) return;
    const nbd = b.slice(); nbd[i] = turn; let captured = []; for (const j of nb(i)) if (nbd[j] === 3 - turn) { const g = group(nbd, j); if (g.libs === 0) captured.push(...g.stones); }
    captured = [...new Set(captured)]; captured.forEach(k => nbd[k] = 0);
    if (group(nbd, i).libs === 0) return; // zelfmoord
    ko = captured.length === 1 && group(nbd, i).stones.length === 1 ? captured[0] : -1;
    b = nbd; caps[turn - 1] += captured.length; last = i; passes = 0; turn = 3 - turn;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
