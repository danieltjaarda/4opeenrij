// Boter, kaas en eieren
module.exports = { title: 'Boter-kaas-eieren', icon: '❌⭕', page: 'bke.html', room: bkeRoom };
function bkeRoom() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] };
  let board, turn, winner, winLine, starter = 1;
  const reset = () => { board = Array(9).fill(0); turn = starter; winner = 0; winLine = null; };
  reset();
  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  room.state = () => ({ type: 'state', board, turn, winner, winLine, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { starter = 3 - starter; reset(); return; }
    if (m.type !== 'place' || winner || turn !== idx + 1 || board[m.i] || !room.players[0] || !room.players[1]) return;
    board[m.i] = turn;
    const l = LINES.find(l => l.every(i => board[i] === turn));
    if (l) { winner = turn; winLine = l; room.score[turn - 1]++; }
    else if (board.every(v => v)) winner = 3;
    else turn = 3 - turn;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  return room;
}
