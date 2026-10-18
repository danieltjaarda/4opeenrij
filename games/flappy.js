module.exports = { title: 'Flappy duel', icon: '🐤', page: 'flappy.html', room: mk };
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let seed, dead, phase, startAt, winner, best;
  const reset = () => { seed = Math.floor(Math.random() * 1e9); dead = [0, 0]; best = [0, 0]; phase = 'wait'; winner = 0; };
  reset();
  room.state = () => ({ type: 'state', phase, startAt, now: Date.now(), seed, dead, best, winner, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.quiet = m => m.type === 'prog';
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) { phase = 'countdown'; startAt = Date.now() + 3000; } }
    if (m.type === 'prog') best[idx] = Math.max(best[idx], m.n | 0);
    if (m.type === 'dead' && phase === 'play' && !dead[idx]) { dead[idx] = Date.now(); best[idx] = Math.max(best[idx], m.n | 0); if (dead[0] && dead[1]) { winner = best[0] > best[1] ? 1 : best[1] > best[0] ? 2 : 3; if (winner < 3) room.score[winner - 1]++; phase = 'done'; } }
  };
  room.onJoin = () => { if (room.players[0] && room.players[1]) { phase = 'countdown'; startAt = Date.now() + 3000; } };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  setInterval(() => { if (phase === 'countdown' && Date.now() >= startAt) { phase = 'play'; room.broadcast(); } if (phase === 'play') room.broadcast(); }, 1000 / 5);
  return room;
}
