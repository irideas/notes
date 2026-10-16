export function initializeAnalytics({ token, productionOrigin, enabled }) {
  if (window.location.origin !== productionOrigin) return;

  // Remove only this site's retired GA storage. Do not create a migration ID.
  try { localStorage.removeItem('notes.analytics-consent'); } catch { /* Storage may be blocked. */ }
  for (const name of ['_ga', '_ga_33MD6529TF']) {
    try {
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
    } catch { /* Cookie restrictions must not break the page. */ }
  }

  const src = 'https://static.cloudflareinsights.com/beacon.min.js';
  if (!enabled || document.querySelector(`script[src="${src}"]`)) return;
  // The supplied module snippet, loaded only on the production origin.
  const script = document.createElement('script');
  script.type = 'module';
  script.src = src;
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  document.head.appendChild(script);
}
