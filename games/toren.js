module.exports = { title: 'Torenbouw', icon: '🏗️', page: 'toren.html', room: mk };
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let blocks, turn, winner, cur, height;
  const reset = () => { blocks = [{ x: 0, w: 6, by: 0 }]; turn = 1; winner = 0; height = 1; cur = { t0: Date.now(), w: 6, speed: 4 + Math.random() }; };
  reset();
  const posAt = (c, t) => { const span = 10 - c.w; const p = ((t - c.t0) / 1000 * c.speed) % (2 * span); return -span / 2 + (p < span ? p : 2 * span - p); };
  room.state = () => ({ type: 'state', blocks, turn, winner, cur, now: Date.now(), height, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'drop' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const top = blocks[blocks.length - 1]; const x = posAt(cur, Date.now()); const left = Math.max(x - cur.w / 2, top.x - top.w / 2), right = Math.min(x + cur.w / 2, top.x + top.w / 2); const w = right - left;
    if (w <= 0.15) { winner = 2 - idx; room.score[winner - 1]++; blocks.push({ x, w: cur.w, by: turn, fell: true }); return; }
    blocks.push({ x: (left + right) / 2, w: +w.toFixed(3), by: turn }); height++; turn = 3 - turn;
    cur = { t0: Date.now(), w: +w.toFixed(3), speed: Math.min(9, 4 + height * 0.35 + Math.random()) };
    if (height >= 25) { winner = 3; }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
