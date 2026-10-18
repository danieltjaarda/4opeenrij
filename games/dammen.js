// Dammen
const { Dammen } = require('../dammen-regels');
module.exports = { title: 'Dammen', icon: '⚪⚫', page: 'dammen.html', room: dammenRoom };
function dammenRoom() {
  const game = new Dammen();
  const room = { players: [null, null], names: ['', ''], score: [0, 0] };
  room.state = () => ({ type: 'state', ...game.state(), names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { game.reset(); return; }
    if (m.type !== 'move' || !room.players[0] || !room.players[1]) return;
    const before = game.winner;
    if (game.move(idx + 1, m.from, m.to) && game.winner && !before) room.score[game.winner - 1]++;
  };
  room.onLeave = () => { room.score = [0, 0]; game.reset(); };
  return room;
}


