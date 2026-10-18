module.exports = { title: 'Mastermind', icon: '🎯', page: 'mastermind.html', room: mk };
const COLORS = 6, LEN = 4, TRIES = 10;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let secret, guesses, winner, solved;
  const reset = () => { secret = Array.from({ length: LEN }, () => Math.floor(Math.random() * COLORS)); guesses = [[], []]; winner = 0; solved = [false, false]; };
  reset();
  const feedback = g => { let black = 0, white = 0; const s = [...secret], gg = [...g]; for (let i = 0; i < LEN; i++) if (gg[i] === s[i]) { black++; s[i] = gg[i] = -1; }
    for (let i = 0; i < LEN; i++) if (gg[i] >= 0) { const j = s.indexOf(gg[i]); if (j >= 0) { white++; s[j] = -1; } } return { black, white }; };
  room.state = () => ({ type: 'state', guesses, winner, solved, secret: winner ? secret : null, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'guess' || winner || solved[idx] || guesses[idx].length >= TRIES || !room.players[0] || !room.players[1]) return;
    const g = (m.g || []).slice(0, LEN).map(v => Math.max(0, Math.min(COLORS - 1, +v | 0))); if (g.length !== LEN) return;
    const fb = feedback(g); guesses[idx].push({ g, ...fb });
    if (fb.black === LEN) { solved[idx] = true; winner = idx + 1; room.score[idx]++; }
    else if (guesses[0].length >= TRIES && guesses[1].length >= TRIES) winner = 3;
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
