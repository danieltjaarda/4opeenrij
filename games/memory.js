module.exports = { title: 'Memory', icon: '🃏', page: 'memory.html', room: mk };
const EMOJI = ['🍎','🚗','🐸','⚽','🎸','🌙','🍕','🐙','🚀','🎁'];
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let cards, open, matched, turn, pairs, winner, busy;
  const reset = () => { cards = [...EMOJI, ...EMOJI].sort(() => Math.random() - 0.5); open = []; matched = Array(20).fill(0); turn = 1; pairs = [0, 0]; winner = 0; busy = false; };
  reset();
  room.state = () => ({ type: 'state', faces: cards.map((c, i) => (open.includes(i) || matched[i]) ? c : null), matched, open, turn, pairs, winner, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'flip' || busy || winner || turn !== idx + 1 || matched[m.i] || open.includes(m.i) || m.i < 0 || m.i > 19 || !room.players[0] || !room.players[1]) return;
    open.push(m.i);
    if (open.length === 2) { busy = true; const [a, b] = open;
      setTimeout(() => { if (cards[a] === cards[b]) { matched[a] = matched[b] = turn; pairs[turn - 1]++; if (pairs[0] + pairs[1] === 10) { winner = pairs[0] > pairs[1] ? 1 : pairs[1] > pairs[0] ? 2 : 3; if (winner < 3) room.score[winner - 1]++; } }
        else turn = 3 - turn; open = []; busy = false; room.broadcast(); }, 900); }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
