module.exports = { title: 'Tanks', icon: '💥', page: 'tanks.html', room: mk };
const N = 120, G = 9.8;
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let terrain, tanks, turn, wind, shot, winner, shotId;
  const genTerrain = () => { const t = []; const a = Math.random() * 6, b = Math.random() * 6, c = Math.random() * 6; for (let i = 0; i < N; i++) { const x = i / N; t.push(8 + 4 * Math.sin(x * 6 + a) + 3 * Math.sin(x * 13 + b) + 2 * Math.sin(x * 29 + c)); } return t; };
  const reset = () => { terrain = genTerrain(); tanks = [{ x: 12, hp: 100, ang: 45, pow: 50 }, { x: N - 13, hp: 100, ang: 135, pow: 50 }]; turn = 1; wind = Math.round((Math.random() - 0.5) * 8); shot = null; winner = 0; shotId = 0; };
  reset();
  const hAt = x => { const i = Math.max(0, Math.min(N - 2, Math.floor(x))); const f = x - i; return terrain[i] * (1 - f) + terrain[i + 1] * f; };
  room.state = () => ({ type: 'state', terrain, tanks, turn, wind, shot, shotId, winner, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (winner || turn !== idx + 1 || !room.players[0] || !room.players[1]) return;
    const t = tanks[idx];
    if (m.type === 'aim') { t.ang = Math.max(0, Math.min(180, +m.ang || 0)); t.pow = Math.max(10, Math.min(100, +m.pow || 0)); }
    if (m.type === 'fire') {
      const a = t.ang * Math.PI / 180, v = t.pow * 0.55; let x = t.x + Math.cos(a) * 2, y = hAt(t.x) + 1.5 + Math.sin(a) * 2, vx = Math.cos(a) * v, vy = Math.sin(a) * v; const path = [[x, y]]; let hit = null;
      for (let s = 0; s < 600; s++) { const dt = 0.03; vx += wind * 0.3 * dt; vy -= G * 2.2 * dt; x += vx * dt; y += vy * dt; path.push([+x.toFixed(2), +y.toFixed(2)]);
        if (x < 0 || x > N - 1) break; if (y <= hAt(x)) { hit = [x, y]; break; }
        const o = tanks[1 - idx]; if (Math.hypot(x - o.x, y - (hAt(o.x) + 1)) < 1.6) { hit = [x, y]; break; } }
      let dmg = [0, 0];
      if (hit) { for (let i = 0; i < N; i++) { const d = Math.abs(i - hit[0]); if (d < 6) terrain[i] = Math.min(terrain[i], Math.max(1, hAt(hit[0]) - Math.sqrt(36 - d * d) * 0.8 + (hit[1] - hAt(hit[0])))); }
        tanks.forEach((tk, i) => { const d = Math.hypot(tk.x - hit[0], hAt(tk.x) + 1 - hit[1]); if (d < 7) { dmg[i] = Math.round(Math.max(0, 50 - d * 6)); tk.hp = Math.max(0, tk.hp - dmg[i]); } }); }
      shot = { path, hit, dmg, by: idx + 1 }; shotId++;
      if (tanks[0].hp <= 0 || tanks[1].hp <= 0) { winner = tanks[0].hp <= 0 && tanks[1].hp <= 0 ? 3 : tanks[0].hp <= 0 ? 2 : 1; if (winner < 3) room.score[winner - 1]++; }
      else { turn = 3 - turn; wind = Math.round((Math.random() - 0.5) * 8); }
    }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
