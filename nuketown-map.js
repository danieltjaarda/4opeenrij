// Nuketown: gedeelde kaart + fysica voor server (Node) en browser.
(function (root) {
  const R = 0.4, H = 1.8, HC = 1.1, EYE = 1.6, EYEC = 0.85, STEP = 0.55, G = 22, JUMP = 7.5;
  const B = (x, y, z, w, h, d, c) => ({ x, y, z, w, h, d, c });
  const boxes = [];
  // Omheining
  boxes.push(B(0, 0, -21, 64, 3, 1, 0x6b6b6b), B(0, 0, 21, 64, 3, 1, 0x6b6b6b), B(-32, 0, 0, 1, 3, 43, 0x6b6b6b), B(32, 0, 0, 1, 3, 43, 0x6b6b6b));
  // Twee huizen (geel links, groen rechts) met een trap naar het balkon
  function house(sx, color) {
    boxes.push(B(sx * 22, 0, 0, 12, 4, 10, color));                 // begane grond
    boxes.push(B(sx * 22, 4, 0, 12, 3.4, 10, color));               // verdieping
    boxes.push(B(sx * 22, 7.4, 0, 13, 0.6, 11, 0x8b3a2a));          // dak
    boxes.push(B(sx * 14.5, 3.7, 0, 3, 0.3, 10, 0xd9c9a3));         // balkon richting straat
    boxes.push(B(sx * 13.1, 4, 0, 0.2, 1, 10, 0xd9c9a3));           // balkonhek
    for (let i = 0; i < 7; i++) boxes.push(B(sx * 22, 0, 6.2 + i * 1.3 - 0.65 * 0, 12, 0.5 * (i + 1), 1.3, 0x9a8f7a)); // trap achter huis (over z)
    boxes.push(B(sx * 22, 0, 6.2 + 7 * 1.3, 12, 3.7, 1.3, 0x9a8f7a)); // bovenste tree sluit aan op balkonhoogte via zijkant
    boxes.push(B(sx * 14.5, 3.7, 5 + 5.2, 3, 0.3, 11, 0xd9c9a3));   // loopbrug van trap naar balkon
  }
  house(-1, 0xe9c46a); house(1, 0x7fb069);
  // Bus in het midden, auto's, kratten en brievenbussen
  boxes.push(B(0, 0, -13.5, 3.2, 3.2, 11, 0xf4a300), B(0, 3.2, -13.5, 2.6, 0.3, 10, 0xd98e00));
  boxes.push(B(-8, 0, 9, 2.2, 1.3, 4.6, 0x3a7bd5), B(8, 0, -9, 2.2, 1.3, 4.6, 0xc0392b));
  boxes.push(B(-8, 1.3, 9, 1.8, 0.6, 2.6, 0x9ec5ff), B(8, 1.3, -9, 1.8, 0.6, 2.6, 0xffb3a7));
  [[0, 13], [-10, -3], [10, 3], [-4, -18], [4, 16]].forEach(([x, z]) => boxes.push(B(x, 0, z, 1.4, 1.1, 1.4, 0xa0744a)));
  boxes.push(B(-10, 1.1, -3, 1.2, 1, 1.2, 0xa0744a), B(10, 1.1, 3, 1.2, 1, 1.2, 0xa0744a));
  [[-13, -8], [13, 8]].forEach(([x, z]) => boxes.push(B(x, 0, z, 0.3, 1.3, 0.3, 0x2b5f9e)));
  // Hekjes
  boxes.push(B(-16, 0, -12, 14, 1.2, 0.2, 0xcccccc), B(16, 0, 12, 14, 1.2, 0.2, 0xcccccc));
  // Spawns: [x, y, z, yaw]  (yaw 0 kijkt naar -z; -π/2 kijkt naar +x)
  const spawns = [[-30, 0, -10, -Math.PI / 2], [30, 0, -10, Math.PI / 2]];
  const bounds = { x: 31, z: 20 };
  // Meer in het midden: cirkel met glooiende oever
  const lake = { x: 0, z: 0, r: 6.5, flat: 4.5, level: -0.3, depth: -2.2 };
  function floorAt(x, z) { const d = Math.hypot(x - lake.x, z - lake.z); if (d >= lake.r) return 0; if (d <= lake.flat) return lake.depth; return lake.depth * (1 - (d - lake.flat) / (lake.r - lake.flat)); }
  // Medkits: [x, z]
  const pickups = [[5, -18], [0, 17], [-14.5, 0], [14.5, 0]];

  function hit(x, y, z, h = H) {
    for (const b of boxes) if (x + R > b.x - b.w / 2 && x - R < b.x + b.w / 2 && y < b.y + b.h && y + h > b.y && z + R > b.z - b.d / 2 && z - R < b.z + b.d / 2) return b;
    return null;
  }
  // Beweeg speler s {x,y,z,vy} met input {fx,fz,jump,speed}; past s aan en zet s.ground
  function move(s, inp, dt) {
    // Opstaan kan alleen als er ruimte is
    if (inp.crouch) s.crouch = true; else if (s.crouch && !hit(s.x, s.y, s.z, H)) s.crouch = false;
    const h = s.crouch ? HC : H;
    const tryAxis = (ax, v) => {
      const old = s[ax]; s[ax] = old + v;
      const b = hit(s.x, s.y, s.z, h); if (!b) return;
      const top = b.y + b.h;
      if (top - s.y <= STEP && top - s.y > 0 && !hit(s.x, top + 0.001, s.z, h)) { s.y = top + 0.001; s.vy = 0; return; }
      s[ax] = old;
    };
    tryAxis('x', inp.fx * inp.speed * dt); tryAxis('z', inp.fz * inp.speed * dt);
    s.x = Math.max(-bounds.x, Math.min(bounds.x, s.x)); s.z = Math.max(-bounds.z, Math.min(bounds.z, s.z));
    const floor = floorAt(s.x, s.z), inWater = s.y + 0.9 < lake.level && floor < 0;
    s.swim = inWater;
    if (inWater) { // drijven: zwakke zwaartekracht, demping, omhoog/omlaag zwemmen
      s.vy += (inp.jump ? 6 : inp.crouch ? -6 : (s.y + 1.3 < lake.level ? 3 : -1)) * dt * 2.5; s.vy *= 0.9; s.vy = Math.max(-3, Math.min(3, s.vy));
      if (s.y + 0.9 + s.vy * dt > lake.level + 0.05 && s.vy > 0) s.vy = Math.min(s.vy, 1.5);
    } else s.vy -= G * dt;
    const oldY = s.y; s.y += s.vy * dt; s.ground = false;
    if (s.y <= floor) { s.y = floor; s.vy = 0; s.ground = true; }
    const b = hit(s.x, s.y, s.z, h);
    if (b) { if (s.vy < 0) { s.y = b.y + b.h + 0.001; s.ground = true; } else { s.y = oldY; } s.vy = 0; }
    if (inp.jump && s.ground && !s.crouch && !inWater) { s.vy = JUMP; s.ground = false; }
  }
  // Raycast tegen kaart; geeft afstand t (Infinity = niets)
  function rayBox(o, d, bx0, by0, bz0, bx1, by1, bz1) {
    let tmin = 0, tmax = Infinity;
    const o3 = [o.x, o.y, o.z], d3 = [d.x, d.y, d.z], mn = [bx0, by0, bz0], mx = [bx1, by1, bz1];
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d3[i]) < 1e-9) { if (o3[i] < mn[i] || o3[i] > mx[i]) return Infinity; continue; }
      let t1 = (mn[i] - o3[i]) / d3[i], t2 = (mx[i] - o3[i]) / d3[i]; if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if (tmin > tmax) return Infinity;
    }
    return tmin;
  }
  function raycast(o, d) {
    let t = d.y < 0 ? -o.y / d.y : Infinity;
    if (t < Infinity) { const hx = o.x + d.x * t, hz = o.z + d.z * t; if (Math.hypot(hx - lake.x, hz - lake.z) < lake.r) { const f = floorAt(hx, hz); t = (f - o.y) / d.y; } }
    for (const b of boxes) t = Math.min(t, rayBox(o, d, b.x - b.w / 2, b.y, b.z - b.d / 2, b.x + b.w / 2, b.y + b.h, b.z + b.d / 2));
    return t;
  }
  // Raak een speler p {x,y,z}: 'head' | 'body' | null, met afstand
  function rayPlayer(o, d, p) {
    const top = p.crouch ? 0.75 : 1.5;
    const tb = rayBox(o, d, p.x - 0.35, p.y, p.z - 0.35, p.x + 0.35, p.y + top, p.z + 0.35);
    const th = rayBox(o, d, p.x - 0.18, p.y + top, p.z - 0.18, p.x + 0.18, p.y + top + 0.35, p.z + 0.18);
    if (th < tb) return { part: 'head', t: th }; if (tb < Infinity) return { part: 'body', t: tb }; return null;
  }
  const dirFrom = (yaw, pitch) => ({ x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) });
  const eyeOf = p => p.crouch ? EYEC : EYE;
  const api = { boxes, spawns, bounds, pickups, lake, floorAt, R, H, HC, EYE, EYEC, eyeOf, move, raycast, rayPlayer, dirFrom };
  root.NUKE = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof self !== 'undefined' ? self : this);
