module.exports = { title: 'Galgje', icon: '🪢', page: 'galgje.html', room: mk };
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let word, guessed, wrong, phase, setter, winner, reveal;
  const reset = () => { word = ''; guessed = []; wrong = 0; phase = 'setword'; winner = 0; reveal = ''; };
  setter = 0; reset();
  const masked = () => word.split('').map(ch => ch === ' ' || guessed.includes(ch) ? ch : '_').join('');
  room.state = () => ({ type: 'state', phase, setter: setter + 1, masked: masked(), len: word.length, guessed, wrong, winner, reveal, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'word' && phase === 'setword' && idx === setter) { const w = String(m.word || '').toLowerCase().replace(/[^a-z ]/g, '').trim().slice(0, 20); if (w.replace(/ /g, '').length < 2) return; word = w; phase = 'guess'; }
    if (m.type === 'letter' && phase === 'guess' && idx !== setter) { const l = String(m.l || '').toLowerCase()[0]; if (!l || !/[a-z]/.test(l) || guessed.includes(l)) return; guessed.push(l);
      if (!word.includes(l)) wrong++;
      if (!masked().includes('_')) { phase = 'done'; winner = idx + 1; room.score[idx]++; reveal = word; }
      else if (wrong >= 8) { phase = 'done'; winner = setter + 1; room.score[setter]++; reveal = word; } }
    if (m.type === 'reset' && phase === 'done') { setter = 1 - setter; reset(); }
  };
  room.onLeave = () => { room.score = [0, 0]; setter = 0; reset(); }; return room;
}
