module.exports = { title: 'Reversi', icon: '⚫⚪', page: 'reversi.html', room: mk };
const D = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
function flips(b, i, p) { const r0 = Math.floor(i/8), c0 = i%8, out = []; if (b[i]) return out;
  for (const [dr, dc] of D) { let r = r0+dr, c = c0+dc, line = []; while (r>=0&&r<8&&c>=0&&c<8&&b[r*8+c]===3-p) { line.push(r*8+c); r+=dr; c+=dc; }
    if (line.length && r>=0&&r<8&&c>=0&&c<8&&b[r*8+c]===p) out.push(...line); } return out; }
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let board, turn, winner, last;
  const legal = p => { const l = []; for (let i = 0; i < 64; i++) if (flips(board, i, p).length) l.push(i); return l; };
  const reset = () => { board = Array(64).fill(0); board[27] = 2; board[28] = 1; board[35] = 1; board[36] = 2; turn = 1; winner = 0; last = null; };
  reset();
  room.state = () => ({ type: 'state', board, turn, winner, last, legal: winner ? [] : legal(turn), count: [board.filter(v => v === 1).length, board.filter(v => v === 2).length], names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'place' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const f = flips(board, m.i, turn); if (!f.length) return;
    board[m.i] = turn; f.forEach(i => board[i] = turn); last = { i: m.i, flipped: f };
    turn = 3 - turn; if (!legal(turn).length) { turn = 3 - turn; if (!legal(turn).length) { const a = board.filter(v => v === 1).length, b = board.filter(v => v === 2).length; winner = a > b ? 1 : b > a ? 2 : 3; if (winner < 3) room.score[winner - 1]++; } }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
