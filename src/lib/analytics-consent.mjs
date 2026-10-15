export function initializeAnalytics() {
  const panel = document.getElementById('analytics-consent');
  if (!panel) return;
  const { measurementId, productionOrigin } = panel.dataset;
  // Basic Consent Mode: neither a script request nor a ping before consent.
  // Also keep development/preview visits out of the production stream.
  if (window.location.origin !== productionOrigin) return;
  const storageKey = 'notes.analytics-consent';
  const settings = document.querySelector('[data-analytics-settings]');
  const accept = panel.querySelector('[data-analytics-accept]');
  const deny = panel.querySelector('[data-analytics-deny]');
  let started = false;
  const readChoice = () => { try { return localStorage.getItem(storageKey); } catch { return null; } };
  const saveChoice = choice => { try { localStorage.setItem(storageKey, choice); } catch { /* This visit still respects the choice. */ } };
  const start = () => {
    if (started) return;
    started = true;
    window['ga-disable-' + measurementId] = false;
    window.dataLayer = window.dataLayer || [];
    const gtag = function () { window.dataLayer.push(arguments); };
    window.gtag = gtag;
    const advertising = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
    gtag('consent', 'default', { ...advertising, analytics_storage: 'denied' });
    gtag('consent', 'update', { ...advertising, analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: window.location.hostname,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
  };
  const stop = () => {
    window['ga-disable-' + measurementId] = true;
    for (const name of ['_ga', '_ga_' + measurementId.slice(2)]) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
    }
    // Discard the loaded tag instead of switching it to denied-mode pings.
    if (started) window.location.reload();
  };
  const close = () => { panel.hidden = true; settings?.focus({ preventScroll: true }); };
  if (settings) {
    settings.hidden = false;
    settings.addEventListener('click', () => { panel.hidden = false; accept.focus(); });
  }
  accept.addEventListener('click', () => { saveChoice('granted'); start(); close(); });
  deny.addEventListener('click', () => { saveChoice('denied'); close(); stop(); });
  panel.querySelector('[data-analytics-details]')?.addEventListener('click', () => { panel.hidden = true; });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    if (readChoice() === 'granted') { start(); panel.hidden = true; }
    else { stop(); panel.hidden = readChoice() === 'denied'; }
  });
  const choice = readChoice();
  if (choice === 'granted') start();
  else panel.hidden = choice === 'denied' || window.location.hash === '#analytics-privacy';
}
