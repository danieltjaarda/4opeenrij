// Internationaal dammen 10x10. 0 leeg, 1 wit, 2 zwart, 3 witte dam, 4 zwarte dam, 5 geslagen (tijdelijk).
const N = 10;
const owner = v => (v === 1 || v === 3) ? 1 : (v === 2 || v === 4) ? 2 : 0;
const isKing = v => v === 3 || v === 4;
const DIRS = [[-1,-1],[-1,1],[1,-1],[1,1]];
const inside = (r, c) => r >= 0 && r < N && c >= 0 && c < N;

function startBoard() {
  const b = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if ((r + c) % 2 === 1) {
    if (r < 4) b[r][c] = 2; else if (r > 5) b[r][c] = 1;
  }
  return b;
}

// Slagen voor één stuk: [{to:[r,c], cap:[r,c]}]
function captures(b, r, c) {
  const v = b[r][c], p = owner(v), out = [];
  for (const [dr, dc] of DIRS) {
    if (!isKing(v)) {
      const mr = r + dr, mc = c + dc, tr = r + 2*dr, tc = c + 2*dc;
      if (inside(tr, tc) && owner(b[mr][mc]) === 3 - p && b[tr][tc] === 0) out.push({ to: [tr, tc], cap: [mr, mc] });
    } else {
      let rr = r + dr, cc = c + dc;
      while (inside(rr, cc) && b[rr][cc] === 0) { rr += dr; cc += dc; }
      if (!inside(rr, cc) || owner(b[rr][cc]) !== 3 - p) continue;
      const cap = [rr, cc]; rr += dr; cc += dc;
      while (inside(rr, cc) && b[rr][cc] === 0) { out.push({ to: [rr, cc], cap }); rr += dr; cc += dc; }
    }
  }
  return out;
}
function steps(b, r, c) {
  const v = b[r][c], p = owner(v), out = [];
  for (const [dr, dc] of DIRS) {
    if (!isKing(v)) {
      if ((p === 1 && dr === 1) || (p === 2 && dr === -1)) continue; // alleen vooruit
      const tr = r + dr, tc = c + dc;
      if (inside(tr, tc) && b[tr][tc] === 0) out.push({ to: [tr, tc] });
    } else {
      let rr = r + dr, cc = c + dc;
      while (inside(rr, cc) && b[rr][cc] === 0) { out.push({ to: [rr, cc] }); rr += dr; cc += dc; }
    }
  }
  return out;
}

// Alle legale zetten voor speler p. Als cont gezet is (meerslag bezig), alleen slagen met dat stuk.
function legalMoves(b, p, cont) {
  const moves = [];
  if (cont) { for (const m of captures(b, cont[0], cont[1])) moves.push({ from: cont, ...m }); return moves; }
  let anyCap = false;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (owner(b[r][c]) === p) {
    const caps = captures(b, r, c);
    if (caps.length) { anyCap = true; for (const m of caps) moves.push({ from: [r, c], ...m }); }
  }
  if (anyCap) return moves;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (owner(b[r][c]) === p)
    for (const m of steps(b, r, c)) moves.push({ from: [r, c], ...m });
  return moves;
}

class Dammen {
  constructor() { this.reset(); }
  reset() { this.board = startBoard(); this.turn = 1; this.winner = 0; this.cont = null; this.last = null; }
  moves() { return legalMoves(this.board, this.turn, this.cont); }
  // Geeft true als zet geldig was
  move(p, from, to) {
    if (p !== this.turn || this.winner) return false;
    const m = this.moves().find(m => m.from[0] === from[0] && m.from[1] === from[1] && m.to[0] === to[0] && m.to[1] === to[1]);
    if (!m) return false;
    const b = this.board, v = b[from[0]][from[1]];
    b[from[0]][from[1]] = 0; b[to[0]][to[1]] = v;
    this.last = { from, to, cap: m.cap || null };
    if (m.cap) {
      b[m.cap[0]][m.cap[1]] = 5;
      if (captures(b, to[0], to[1]).length) { this.cont = to; return true; }
    }
    // Einde zet: geslagen stukken weg, promotie, beurtwissel
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b[r][c] === 5) b[r][c] = 0;
    if (v === 1 && to[0] === 0) b[to[0]][to[1]] = 3;
    if (v === 2 && to[0] === N - 1) b[to[0]][to[1]] = 4;
    this.cont = null; this.turn = 3 - this.turn;
    if (!this.moves().length) this.winner = 3 - this.turn;
    return true;
  }
  state() { return { board: this.board, turn: this.turn, winner: this.winner, cont: this.cont, last: this.last, moves: this.winner ? [] : this.moves() }; }
}
module.exports = { Dammen };
