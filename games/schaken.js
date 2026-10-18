module.exports = { title: 'Schaken', icon: '♞', page: 'schaken.html', room: mk };
const START = ['rnbqkbnr', 'pppppppp', '', '', '', '', 'PPPPPPPP', 'RNBQKBNR'];
function newBoard() { return START.map(r => r ? r.split('') : Array(8).fill('')); }
const isW = p => p && p === p.toUpperCase(), col = p => isW(p) ? 1 : 2;
function attacks(b, r, c, byW) { // wordt veld (r,c) aangevallen door kleur byW?
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const p = b[i][j]; if (!p || isW(p) !== byW) continue; if (pseudo(b, i, j, null, true).some(m => m[0] === r && m[1] === c)) return true; } return false; }
function pseudo(b, r, c, st, attackOnly) {
  const p = b[r][c], w = isW(p), t = p.toLowerCase(), out = [], ok = (i, j) => i >= 0 && i < 8 && j >= 0 && j < 8, empty = (i, j) => !b[i][j], enemy = (i, j) => b[i][j] && isW(b[i][j]) !== w;
  const slide = dirs => { for (const [di, dj] of dirs) { let i = r + di, j = c + dj; while (ok(i, j)) { if (empty(i, j)) out.push([i, j]); else { if (enemy(i, j)) out.push([i, j]); break; } i += di; j += dj; } } };
  if (t === 'p') { const d = w ? -1 : 1, start = w ? 6 : 1;
    if (!attackOnly) { if (ok(r + d, c) && empty(r + d, c)) { out.push([r + d, c]); if (r === start && empty(r + 2 * d, c)) out.push([r + 2 * d, c]); } }
    for (const dj of [-1, 1]) { const i = r + d, j = c + dj; if (!ok(i, j)) continue; if (attackOnly || enemy(i, j)) out.push([i, j]); else if (st && st.ep && st.ep[0] === i && st.ep[1] === j) out.push([i, j, 'ep']); } }
  else if (t === 'n') for (const [di, dj] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]) { const i = r + di, j = c + dj; if (ok(i, j) && (empty(i, j) || enemy(i, j))) out.push([i, j]); }
  else if (t === 'b') slide([[1,1],[1,-1],[-1,1],[-1,-1]]); else if (t === 'r') slide([[1,0],[-1,0],[0,1],[0,-1]]); else if (t === 'q') slide([[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]);
  else if (t === 'k') { for (const di of [-1, 0, 1]) for (const dj of [-1, 0, 1]) { if (!di && !dj) continue; const i = r + di, j = c + dj; if (ok(i, j) && (empty(i, j) || enemy(i, j))) out.push([i, j]); }
    if (!attackOnly && st) { const row = w ? 7 : 0, K = w ? 'K' : 'k', R = w ? 'R' : 'r'; if (r === row && c === 4 && !st.moved[K]) {
      if (!st.moved[R + 'h'] && b[row][7] === R && !b[row][5] && !b[row][6] && !attacks(b, row, 4, !w) && !attacks(b, row, 5, !w) && !attacks(b, row, 6, !w)) out.push([row, 6, 'O-O']);
      if (!st.moved[R + 'a'] && b[row][0] === R && !b[row][1] && !b[row][2] && !b[row][3] && !attacks(b, row, 4, !w) && !attacks(b, row, 3, !w) && !attacks(b, row, 2, !w)) out.push([row, 2, 'O-O-O']); } } }
  return out;
}
function apply(b, from, to, flag) { const nb = b.map(r => [...r]); const p = nb[from[0]][from[1]]; nb[from[0]][from[1]] = ''; nb[to[0]][to[1]] = p;
  if (flag === 'ep') nb[from[0]][to[1]] = ''; if (flag === 'O-O') { nb[to[0]][5] = nb[to[0]][7]; nb[to[0]][7] = ''; } if (flag === 'O-O-O') { nb[to[0]][3] = nb[to[0]][0]; nb[to[0]][0] = ''; }
  if (p.toLowerCase() === 'p' && (to[0] === 0 || to[0] === 7)) nb[to[0]][to[1]] = isW(p) ? 'Q' : 'q'; return nb; }
function kingPos(b, w) { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if (b[i][j] === (w ? 'K' : 'k')) return [i, j]; }
function legal(b, st, w) { const out = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = b[r][c]; if (!p || isW(p) !== w) continue;
  for (const m of pseudo(b, r, c, st)) { const nb = apply(b, [r, c], m, m[2]); const k = kingPos(nb, w); if (k && !attacks(nb, k[0], k[1], !w)) out.push({ from: [r, c], to: [m[0], m[1]], flag: m[2] || null }); } } return out; }
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let b, st, turn, winner, last, check, captured, moves;
  const reset = () => { b = newBoard(); st = { moved: {}, ep: null }; turn = 1; winner = 0; last = null; check = false; captured = []; moves = legal(b, st, true); };
  reset();
  room.state = () => ({ type: 'state', board: b, turn, winner, last, check, captured, moves, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type === 'resign' && !winner && room.players[0] && room.players[1]) { winner = 2 - idx; room.score[winner - 1]++; return; }
    if (m.type !== 'move' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const mv = moves.find(x => x.from[0] === m.from[0] && x.from[1] === m.from[1] && x.to[0] === m.to[0] && x.to[1] === m.to[1]); if (!mv) return;
    const p = b[mv.from[0]][mv.from[1]], cap = mv.flag === 'ep' ? b[mv.from[0]][mv.to[1]] : b[mv.to[0]][mv.to[1]]; if (cap) captured.push(cap);
    b = apply(b, mv.from, mv.to, mv.flag); last = mv;
    if (p === 'K') st.moved.K = true; if (p === 'k') st.moved.k = true; if (p === 'R' && mv.from[1] === 7) st.moved.Rh = true; if (p === 'R' && mv.from[1] === 0) st.moved.Ra = true; if (p === 'r' && mv.from[1] === 7) st.moved.rh = true; if (p === 'r' && mv.from[1] === 0) st.moved.ra = true;
    st.ep = p.toLowerCase() === 'p' && Math.abs(mv.to[0] - mv.from[0]) === 2 ? [(mv.to[0] + mv.from[0]) / 2, mv.to[1]] : null;
    turn = 3 - turn; const w = turn === 1; moves = legal(b, st, w); const k = kingPos(b, w); check = k && attacks(b, k[0], k[1], !w);
    if (!moves.length) { winner = check ? 3 - turn : 3; if (winner < 3) room.score[winner - 1]++; }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
