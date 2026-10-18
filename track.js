// Gedeeld circuit (server + browser). Catmull-Rom door waypoints, bemonsterd op vaste afstand.
(function (root) {
  const WAYPOINTS = [
    [0, 0], [60, -5], [110, 10], [140, 50], [120, 95], [70, 110], [30, 90], [-10, 110],
    [-60, 120], [-110, 90], [-130, 40], [-110, -10], [-70, -40], [-30, -60], [-60, -100],
    [-20, -130], [30, -125], [55, -90], [30, -55], [-40, -25]
  ];
  const WIDTH = 14;
  function cr(p0, p1, p2, p3, t) {
    const t2 = t*t, t3 = t2*t;
    return [
      0.5*((2*p1[0]) + (-p0[0]+p2[0])*t + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
      0.5*((2*p1[1]) + (-p0[1]+p2[1])*t + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
    ];
  }
  // Fijn bemonsteren, daarna hermonsteren op gelijke afstand
  const fine = [];
  const n = WAYPOINTS.length;
  for (let i = 0; i < n; i++) {
    const p0 = WAYPOINTS[(i-1+n)%n], p1 = WAYPOINTS[i], p2 = WAYPOINTS[(i+1)%n], p3 = WAYPOINTS[(i+2)%n];
    for (let s = 0; s < 40; s++) fine.push(cr(p0, p1, p2, p3, s/40));
  }
  const STEP = 2;
  const samples = []; let acc = 0, prev = fine[0];
  samples.push({ x: prev[0], z: prev[1] });
  for (let i = 1; i <= fine.length; i++) {
    const p = fine[i % fine.length];
    const d = Math.hypot(p[0]-prev[0], p[1]-prev[1]); acc += d;
    while (acc >= STEP) { acc -= STEP; const k = 1 - acc/d; samples.push({ x: prev[0] + (p[0]-prev[0])*k, z: prev[1] + (p[1]-prev[1])*k }); }
    prev = p;
  }
  const LEN = samples.length * STEP;
  for (let i = 0; i < samples.length; i++) {
    const a = samples[(i+1)%samples.length], b = samples[(i-1+samples.length)%samples.length];
    const dx = a.x-b.x, dz = a.z-b.z, l = Math.hypot(dx, dz);
    samples[i].dx = dx/l; samples[i].dz = dz/l; // richting
    samples[i].nx = -samples[i].dz; samples[i].nz = samples[i].dx; // normaal (links)
  }
  function pointAt(dist, lateral) {
    dist = ((dist % LEN) + LEN) % LEN;
    const f = dist / STEP, i = Math.floor(f), t = f - i;
    const a = samples[i % samples.length], b = samples[(i+1) % samples.length];
    const x = a.x + (b.x-a.x)*t + a.nx*(lateral||0), z = a.z + (b.z-a.z)*t + a.nz*(lateral||0);
    return { x, z, dx: a.dx, dz: a.dz };
  }
  // Dichtstbijzijnde sample (zoek rond hint)
  function nearest(x, z, hint) {
    const m = samples.length; let best = -1, bd = Infinity;
    const range = hint == null ? m : 40;
    for (let k = -range; k <= range; k++) {
      const i = hint == null ? k + range : ((hint + k) % m + m) % m;
      if (i < 0 || i >= m) continue;
      const s = samples[i], d = (s.x-x)**2 + (s.z-z)**2;
      if (d < bd) { bd = d; best = i; }
    }
    const s = samples[best];
    const lat = (x - s.x)*s.nx + (z - s.z)*s.nz;
    return { index: best, dist: best*STEP, offTrack: Math.abs(lat) > WIDTH/2 + 1.5, lateral: lat };
  }
  const BOOSTS = [0.18, 0.47, 0.76].map(f => Math.round(f * LEN)); // afstanden met boostpads
  const T = { WIDTH, STEP, LEN, samples, pointAt, nearest, BOOSTS, LAPS: 3 };
  if (typeof module !== 'undefined') module.exports = T; else root.TRACK = T;
})(typeof window !== 'undefined' ? window : globalThis);
