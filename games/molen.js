module.exports = { title: 'Molen', icon: '🌀', page: 'molen.html', room: mk };
// 24 punten: 3 vierkanten × 8; index = ring*8 + pos (pos 0 linksboven, met de klok mee)
const ADJ = []; for (let r = 0; r < 3; r++) for (let p = 0; p < 8; p++) { const a = [r * 8 + (p + 1) % 8, r * 8 + (p + 7) % 8]; if (p % 2 === 1) { if (r > 0) a.push((r - 1) * 8 + p); if (r < 2) a.push((r + 1) * 8 + p); } ADJ.push(a); }
const MILLS = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) MILLS.push([r * 8 + k * 2, r * 8 + k * 2 + 1, r * 8 + (k * 2 + 2) % 8]); for (let p = 1; p < 8; p += 2) MILLS.push([p, 8 + p, 16 + p]);
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let b, turn, winner, hand, phase, remove, sel, last;
  const reset = () => { b = Array(24).fill(0); turn = 1; winner = 0; hand = [9, 9]; phase = 'place'; remove = false; last = null; };
  reset();
  const inMill = i => MILLS.some(m => m.includes(i) && m.every(k => b[k] === b[i]));
  const count = p => b.filter(v => v === p).length;
  const canMove = p => count(p) === 3 ? true : b.some((v, i) => v === p && ADJ[i].some(j => !b[j]));
  const moves = () => { if (winner || !room.players[0] || !room.players[1]) return []; const p = turn;
    if (remove) { const opp = 3 - p; let t = b.map((v, i) => v === opp && !inMill(i) ? i : -1).filter(i => i >= 0); if (!t.length) t = b.map((v, i) => v === opp ? i : -1).filter(i => i >= 0); return t.map(i => ({ remove: i })); }
    if (hand[p - 1] > 0) return b.map((v, i) => v ? -1 : i).filter(i => i >= 0).map(i => ({ to: i }));
    const fly = count(p) === 3; const out = []; b.forEach((v, i) => { if (v !== p) return; (fly ? b.map((w, j) => w ? -1 : j).filter(j => j >= 0) : ADJ[i].filter(j => !b[j])).forEach(j => out.push({ from: i, to: j })); }); return out; };
  room.state = () => ({ type: 'state', board: b, turn, winner, hand, remove, last, moves: moves(), names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'move' || winner || turn !== idx + 1) return; const p = turn; const legal = moves();
    if (remove) { if (!legal.some(x => x.remove === m.remove)) return; b[m.remove] = 0; remove = false; last = { remove: m.remove }; }
    else { const mv = legal.find(x => x.to === m.to && (x.from === undefined ? m.from === undefined : x.from === m.from)); if (!mv) return; if (mv.from !== undefined) b[mv.from] = 0; else hand[p - 1]--; b[mv.to] = p; last = mv;
      if (inMill(mv.to) && b.some((v, i) => v === 3 - p)) { remove = true; return; } }
    const opp = 3 - p; if (hand[opp - 1] === 0 && (count(opp) < 3 || !canMove(opp))) { winner = p; room.score[p - 1]++; return; }
    turn = opp;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
