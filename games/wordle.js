module.exports = { title: 'Woordduel', icon: '🔤', page: 'wordle.html', room: mk };
const WORDS = 'appel baken brood dansen drank fiets gras grond hamer hemel honing kaars kaart kamer kasteel kelder ketel kleur klok koffie konijn koning kroon lamp lente lepel licht liefde maand markt melk molen muziek nacht olie paard parel piano plant regen reiziger ring roos rots schip school slang sleutel sneeuw spiegel staart steen storm strand suiker tafel tuin vlag vogel water wereld wolk zomer zwaan'.split(' ').filter(w => w.length === 5);
const EXTRA = 'adres bijna blauw boter dicht draad druif eiland fruit geluk glas groen haven hoofd jonge kind klein kruid lucht maart meeuw merel mooie nieuw oever peper prijs recht rijst rivier schat sport stoel stuur tegel toren trein vaart vlieg vorst vroeg wagen wortel zacht zeven zuster'.split(' ').filter(w => w.length === 5);
const ALL = [...new Set([...WORDS, ...EXTRA])];
const HINTS = {
  appel: 'Fruit dat van de boom valt, rood of groen',
  baken: 'Wijst schepen de weg',
  brood: 'Bakker, sneetjes, beleg',
  drank: 'Iets om te drinken',
  fiets: 'Twee wielen, trappen maar',
  grond: 'Daar sta je op, de aarde onder je voeten',
  hamer: 'Gereedschap om spijkers mee te slaan',
  hemel: 'Daarboven, waar de wolken zijn',
  kaars: 'Geeft licht met een vlammetje',
  kaart: 'Landkaart, of speel je ermee',
  kamer: 'Een ruimte in huis',
  ketel: 'Daar kook je water in',
  kleur: 'Rood, blauw, geel…',
  kroon: 'Draagt een koning op zijn hoofd',
  lente: 'Jaargetijde waarin alles weer groeit',
  lepel: 'Bestek om soep mee te eten',
  licht: 'Tegenovergestelde van donker',
  maand: 'Januari is er een',
  markt: 'Daar koop je groente bij kraampjes',
  molen: 'Draait met wieken in de wind',
  nacht: 'Als het donker is en je slaapt',
  paard: 'Dier waarop je kunt rijden',
  parel: 'Kostbaar bolletje uit een oester',
  piano: 'Muziekinstrument met zwarte en witte toetsen',
  plant: 'Groeit in een pot of in de tuin',
  regen: 'Valt uit de wolken, pak je paraplu',
  schip: 'Vaart op zee',
  slang: 'Kruipend dier zonder poten',
  steen: 'Hard en zwaar, ligt op de grond',
  storm: 'Heel harde wind',
  tafel: 'Daar eet je aan',
  vogel: 'Dier met veren en vleugels',
  water: 'Komt uit de kraan, je kunt erin zwemmen',
  zomer: 'Warmste jaargetijde, vakantie!',
  zwaan: 'Witte watervogel met lange hals',
  adres: 'Straat en huisnummer',
  bijna: 'Net niet helemaal',
  blauw: 'De kleur van de lucht',
  boter: 'Smeer je op je brood',
  dicht: 'Tegenovergestelde van open',
  draad: 'Dun en lang, zit in een naald',
  druif: 'Klein fruit in trosjes, wijn wordt ervan gemaakt',
  fruit: 'Appels, peren, bananen samen',
  geluk: 'Als je blij bent of mazzel hebt',
  groen: 'De kleur van gras',
  haven: 'Daar liggen schepen aangemeerd',
  hoofd: 'Daar zitten je ogen en oren aan',
  jonge: 'Niet oud (ook: een jongen)',
  klein: 'Tegenovergestelde van groot',
  kruid: 'Peterselie of basilicum is er een',
  lucht: 'Daarboven, blauw op een mooie dag',
  maart: 'Derde maand van het jaar',
  meeuw: 'Vogel aan het strand die je patat steelt',
  merel: 'Zwarte zangvogel met gele snavel',
  mooie: 'Niet lelijk',
  nieuw: 'Tegenovergestelde van oud',
  oever: 'De kant van een rivier of meer',
  peper: 'Zwart, scherp, staat naast het zout',
  prijs: 'Wat iets kost, of wat je wint',
  recht: 'Niet krom, of iets waar je recht op hebt',
  rijst: 'Witte korrels, eet je bij Chinees',
  schat: 'Kist vol goud van piraten',
  sport: 'Voetbal, tennis of zwemmen',
  stoel: 'Daar zit je op',
  stuur: 'Daarmee bepaal je welke kant je op gaat',
  tegel: 'Vierkant plaatje op vloer of muur',
  toren: 'Hoog en smal gebouw',
  trein: 'Rijdt over rails',
  vaart: 'Snelheid, of een kanaal met water',
  vlieg: 'Klein zoemend insect',
  vorst: 'Vrieskou, of een koning',
  vroeg: 'Tegenovergestelde van laat',
  wagen: 'Een auto of kar',
  zacht: 'Tegenovergestelde van hard',
  zeven: 'Getal tussen zes en acht'
};
function mk() {
  const room = { players: [null, null], names: ['', ''], score: [0, 0] }; let word, guesses, winner, solved, turn;
  const reset = () => { word = ALL[Math.floor(Math.random() * ALL.length)]; guesses = [[], []]; winner = 0; solved = [false, false]; turn = 1; };
  reset();
  const fb = g => { const r = Array(5).fill(0), w = word.split(''), gg = g.split(''); for (let i = 0; i < 5; i++) if (gg[i] === w[i]) { r[i] = 2; w[i] = null; gg[i] = null; } for (let i = 0; i < 5; i++) if (gg[i]) { const j = w.indexOf(gg[i]); if (j >= 0) { r[i] = 1; w[j] = null; } } return r; };
  // Hint vanaf de 4e rij: een omschrijving van het woord
  // Hint voor allebei tegelijk, zodra beide spelers 3 pogingen hebben gedaan (4e rij)
  const hint = () => (guesses[0].length >= 3 && guesses[1].length >= 3 && !winner) ? (HINTS[word] || 'Geen hint voor dit woord') : null;
  room.state = () => ({ type: 'state', turn, guesses, winner, solved, hint: hint(), word: winner ? word : null, names: room.names, score: room.score, connected: room.players.map(p => !!p) });
  room.onMessage = (idx, m) => {
    if (m.type === 'reset') return reset();
    if (m.type !== 'guess' || winner || turn !== idx + 1 || solved[idx] || guesses[idx].length >= 6 || !room.players[0] || !room.players[1]) return;
    const g = String(m.g || '').toLowerCase(); if (!/^[a-z]{5}$/.test(g)) return;
    guesses[idx].push({ g, fb: fb(g) }); if (g === word) { solved[idx] = true; winner = idx + 1; room.score[idx]++; } else if (guesses[0].length >= 6 && guesses[1].length >= 6) winner = 3; else { turn = 3 - turn; if (guesses[turn - 1].length >= 6) turn = 3 - turn; }
  };
  room.onLeave = () => { room.score = [0, 0]; reset(); }; return room;
}
