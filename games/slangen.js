module.exports = { title: 'Slangen & ladders', icon: '🪜', page: 'slangen.html', room: mk };
const JUMPS = { 4: 14, 9: 31, 17: 7, 20: 38, 28: 84, 40: 59, 51: 67, 54: 34, 62: 19, 63: 81, 64: 60, 71: 91, 87: 24, 93: 73, 95: 75, 99: 78 };
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let pos, turn, winner, roll, rollId, lastJump;
  const reset = () => { pos = [0, 0]; turn = 1; winner = 0; roll = 0; rollId = 0; lastJump = null; };
  reset();
  room.state = () => ({ type: 'state', pos, turn, winner, roll, rollId, lastJump, jumps: JUMPS, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'roll' || winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    roll = 1 + Math.floor(Math.random() * 6); rollId++; lastJump = null; let p = pos[idx] + roll;
    if (p > 100) p = pos[idx]; else if (JUMPS[p]) { lastJump = { from: p, to: JUMPS[p], player: idx + 1 }; p = JUMPS[p]; }
    pos[idx] = p; if (p === 100) { winner = idx + 1; room.score[idx]++; } else if (roll !== 6) turn = 3 - turn;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
