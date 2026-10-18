module.exports = { title: 'Mollen meppen', icon: '🐹', page: 'mol.html', room: mk };
const N = 9, WIN = 15;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let moles, pts, phase, winner, nid = 1;
  const reset = () => { moles = []; pts = [0, 0]; phase = 'wait'; winner = 0; };
  reset();
  room.state = () => ({ type: 'state', phase, winner, moles, pts, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) phase = 'play'; }
    if (m.type === 'hit' && phase === 'play') { const i = moles.findIndex(x => x.id === m.id); if (i >= 0) { const mo = moles[i]; moles.splice(i, 1); pts[idx] += mo.gold ? 3 : 1; if (pts[idx] >= WIN) { winner = idx + 1; room.score[idx]++; phase = 'done'; } } }
  };
  room.onJoin = () => { if (room.players[0] && room.players[1]) phase = 'play'; };
  room.onLeave = () => { room.score = [0, 0]; reset(); };
  setInterval(() => { if (phase !== 'play') return; const now = Date.now(); moles = moles.filter(m => m.until > now);
    if (moles.length < 3 && Math.random() < 0.5) { const free = [...Array(N).keys()].filter(h => !moles.some(m => m.hole === h)); if (free.length) moles.push({ id: nid++, hole: free[Math.floor(Math.random() * free.length)], until: now + 900 + Math.random() * 900, gold: Math.random() < 0.12 }); }
    room.broadcast(); }, 250);
  return room;
}
