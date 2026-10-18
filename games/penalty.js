module.exports = { title: 'Penalty\'s', icon: '⚽', page: 'penalty.html', room: mk };
const ROUNDS = 5;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let shooter, round, goals, choice, result, winner, resId;
  const reset = () => { shooter = 1; round = 1; goals = [0, 0]; choice = [null, null]; result = null; winner = 0; resId = 0; };
  reset();
  room.state = () => ({ type: 'state', shooter, round, goals, picked: choice.map(c => !!c), result, resId, winner, ROUNDS, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'pick' || winner || choice[idx] || !room.players[0] || !room.players[1]) return;
    choice[idx] = { x: Math.max(-1, Math.min(1, +m.x || 0)), y: Math.max(0, Math.min(1, +m.y || 0)), pow: Math.max(0.3, Math.min(1, +m.pow || 0.7)) };
    if (!choice[0] || !choice[1]) return;
    const sh = choice[shooter - 1], kp = choice[2 - shooter]; const miss = Math.abs(sh.x) > 0.93 || sh.y > 0.93 && sh.pow > 0.9; const dist = Math.hypot(sh.x - kp.x, (sh.y - kp.y) * 0.8); const saved = !miss && dist < 0.45 - sh.pow * 0.2;
    const goal = !miss && !saved; if (goal) goals[shooter - 1]++; result = { shot: sh, keeper: kp, goal, saved, miss, shooter }; resId++; choice = [null, null];
    if (shooter === 2) round++; shooter = 3 - shooter;
    const left = [ROUNDS - round + (shooter === 1 ? 1 : 0), ROUNDS - round + 1]; // ruwe check: einde na 5 rondes
    if (round > ROUNDS) { winner = goals[0] > goals[1] ? 1 : goals[1] > goals[0] ? 2 : 3; if (winner < 3) room.score[winner - 1]++; }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
