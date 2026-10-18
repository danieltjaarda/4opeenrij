// Uitbreiding op track.js: hoogteprofiel, schansen en itemboxen
(function (root) {
  const T = typeof module !== 'undefined' ? require('./track.js') : root.TRACK;
  const L = T.LEN;
  // Heuvels: som van sinussen over de ronde, nul bij start
  const height = d => { const f = ((d % L) + L) % L / L; return (Math.sin(f * Math.PI * 2 * 2) * 3 + Math.sin(f * Math.PI * 2 * 5 + 1) * 1.5 + Math.sin(f * Math.PI * 2 * 3 + 2) * 2) - (Math.sin(0) * 3 + Math.sin(1) * 1.5 + Math.sin(2) * 2) * (1 - f) * 0 ; };
  // Zorg dat hoogte bij d=0 en d=L gelijk is: dat is zo omdat alle termen periodiek zijn in f
  const RAMPS = [0.12, 0.40, 0.68, 0.88].map(f => Math.round(f * L)); // schans-afstanden
  const BOXES = []; for (const f of [0.06, 0.25, 0.33, 0.52, 0.60, 0.80, 0.95]) for (const lat of [-4, 0, 4]) BOXES.push({ id: BOXES.length, d: Math.round(f * L), lat });
  const T2 = { height, RAMPS, BOXES, RAMP_LEN: 10, RAMP_H: 2.2 };
  if (typeof module !== 'undefined') module.exports = T2; else root.TRACK2 = T2;
})(typeof window !== 'undefined' ? window : globalThis);
