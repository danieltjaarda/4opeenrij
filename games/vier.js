// Vier op een rij
module.exports = { title: 'Vier op een rij', icon: '🔴🟡', page: 'vier.html', room: vierRoom };
function vierRoom() {
  let board, turn, winner, winCells;
  const room = { players: [null, null], names: ['', ''], score: [0, 0] };
  const reset = () => { board = Array.from({ length: 7 }, () => Array(6).fill(0)); turn = 1; winner = 0; winCells = []; };
  reset();
  const checkWin = (c, r, p) => {
    for (const [dx, dy] of [[1,0],[0,1],[1,1],[1,-1]]) {
      const cells = [[c, r]];
      for (const s of [1, -1]) {
        let x = c + dx*s, y = r + dy*s;
        while (x>=0 && x<7 && y>=0 && y<6 && board[x][y] === p) { cells.push([x, y]); x += dx*s; y += dy*s; }
      }
      if (cells.length >= 4) { winCells = cells; return true; }
    }
    return false;
  };
  room.state = () => ({ type: 'state', board, turn, winner, winCells, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { reset(); return; }
    if (m.type !== 'drop' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const col = board[m.col]; if (!col) return;
    const r = col.indexOf(0); if (r === -1) return;
    col[r] = turn;
    if (checkWin(m.col, r, turn)) { winner = turn; room.score[turn - 1]++; }
    else if (board.every(c => c.every(v => v))) winner = 3;
    else turn = 3 - turn;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  return room;
}

