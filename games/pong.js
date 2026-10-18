// Pong 3D: server simuleert bal en paddles
const W = 20, H = 12, PAD = 3, SPEED0 = 15, SPEEDMAX = 42, MAXANG = Math.PI / 3, WIN = 7;
module.exports = { title: 'Pong 3D', icon: '🏓', page: 'pong.html', room: pongRoom };
function pongRoom() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] };
  let ball, pad, target, pts, phase, serveAt, winner, last = Date.now();
  const serve = dir => { const a = (Math.random() - 0.5) * 0.8; ball = { x: 0, z: 0, vx: SPEED0 * Math.cos(a) * dir, vz: SPEED0 * Math.sin(a), hit: 0, wall: 0 }; serveAt = Date.now() + 1200; };
  const reset = () => { pad = [0, 0]; target = [0, 0]; pts = [0, 0]; winner = 0; phase = 'wait'; serve(Math.random() < 0.5 ? 1 : -1); };
  reset();
  room.state = () => ({ type: 'state', phase, ball, pad, pts, winner, serveAt, now: Date.now(), names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.quiet = m => m.type === 'pad';
  room.onMessage = (idx, m) => {
    if (m.type === 'pad') target[idx] = Math.max(-H/2 + PAD/2, Math.min(H/2 - PAD/2, +m.z || 0));
    if (m.type === 'reset') { reset(); if (room.players[0] && room.players[1]) phase = 'play'; }
  };
  room.onJoin = () => { if (room.players[0] && room.players[1]) { phase = 'play'; serve(1); } };
  room.onLeave = () => reset();
  setInterval(() => {
    const now = Date.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (let i = 0; i < 2; i++) pad[i] += (target[i] - pad[i]) * Math.min(1, dt * 18);
    if (phase !== 'play') return;
    if (now < serveAt) { room.broadcast(); return; }
    ball.x += ball.vx * dt; ball.z += ball.vz * dt;
    if (ball.z > H/2 - 0.4) { ball.z = H/2 - 0.4; ball.vz = -Math.abs(ball.vz); ball.wall++; }
    if (ball.z < -H/2 + 0.4) { ball.z = -H/2 + 0.4; ball.vz = Math.abs(ball.vz); ball.wall++; }
    // paddles: speler 1 links (x=-W/2+1), speler 2 rechts
    const hit = (i, px) => {
      if (Math.abs(ball.z - pad[i]) < PAD/2 + 0.4) {
        // Uitgaande hoek bepaald door raakpunt op de paddle (zoals echt 3D-pong), snelheid groeit per slag
        const rel = Math.max(-1, Math.min(1, (ball.z - pad[i]) / (PAD/2)));
        const ang = rel * MAXANG;
        const speed = Math.min(SPEEDMAX, Math.hypot(ball.vx, ball.vz) * 1.12 + 0.8);
        const dir = i === 0 ? 1 : -1;
        ball.x = px; ball.vx = Math.cos(ang) * speed * dir; ball.vz = Math.sin(ang) * speed;
        ball.hit = (ball.hit || 0) + 1; ball.hitRel = rel; ball.hitSide = i; return true;
      }
      return false;
    };
    if (ball.vx < 0 && ball.x < -W/2 + 1.4 && ball.x > -W/2 + 0.2) hit(0, -W/2 + 1.4);
    if (ball.vx > 0 && ball.x > W/2 - 1.4 && ball.x < W/2 - 0.2) hit(1, W/2 - 1.4);
    if (ball.x < -W/2 - 1) { pts[1]++; if (pts[1] >= WIN) { winner = 2; phase = 'done'; room.score[1]++; } else serve(1); }
    if (ball.x > W/2 + 1) { pts[0]++; if (pts[0] >= WIN) { winner = 1; phase = 'done'; room.score[0]++; } else serve(-1); }
    room.broadcast();
  }, 1000 / 30);
  return room;
}
