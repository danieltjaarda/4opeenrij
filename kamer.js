// Eén kamer per browser, gedeeld door alle tabbladen.
(function () {
  const ok = c => /^\d{4}$/.test(c || '');
  const q = new URLSearchParams(location.search), urlCode = ok(q.get('code')) ? q.get('code') : null;
  const nav = performance.getEntriesByType('navigation')[0], fresh = !nav || nav.type === 'navigate';
  let stored = localStorage.getItem('kamer'); if (!ok(stored)) stored = null;
  let extern = true; try { extern = !document.referrer || new URL(document.referrer).origin !== location.origin; } catch {}
  // Gedeelde link (van buiten, geen herlaad) wint; anders de kamer die deze browser al gebruikt
  let code = (urlCode && fresh && (extern || !stored)) ? urlCode : (stored || urlCode || String(1000 + Math.floor(Math.random() * 9000)));
  localStorage.setItem('kamer', code);
  if (q.get('code') !== code) { q.set('code', code); history.replaceState(null, '', location.pathname + '?' + q); }
  window.KAMER = code;
  window.setKamer = c => { if (!ok(c)) return; localStorage.setItem('kamer', c); location.href = '/?code=' + c; };
  const inGame = location.pathname !== '/';
  // Ander tabblad wisselt van kamer: lobby volgt, een spel gaat terug naar de lobby
  addEventListener('storage', e => { if (e.key === 'kamer' && ok(e.newValue) && e.newValue !== code) location.replace('/?code=' + e.newValue); });
  // Eén speltabblad tegelijk: het nieuwste wint, oudere speltabbladen gaan naar de lobby
  if (inGame && window.BroadcastChannel) {
    const bc = new BroadcastChannel('spel-tab'), id = Math.random().toString(36).slice(2);
    bc.onmessage = ev => { if (ev.data && ev.data.claim && ev.data.claim !== id) location.replace('/?code=' + code + '&bericht=tab'); };
    bc.postMessage({ claim: id });
  }
})();
