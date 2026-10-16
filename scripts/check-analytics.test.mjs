import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initializeAnalytics } from '../src/lib/analytics.mjs';
import analytics from '../src/data/analytics.json' with { type: 'json' };

const config = { token: analytics.cloudflareToken, productionOrigin: 'https://notes.irideas.pro', enabled: true };
function browser({ preview = false, storageBlocked = false, cookiesBlocked = false } = {}) {
  const scripts = [], removals = [], cookieWrites = [];
  const stored = new Map([['notes.analytics-consent', 'granted'], ['reader-preference', 'keep']]);
  globalThis.window = { location: { origin: preview ? 'http://localhost:4321' : config.productionOrigin, hostname: preview ? 'localhost' : 'notes.irideas.pro' } };
  globalThis.localStorage = { removeItem(name) { if (storageBlocked) throw Error('blocked'); removals.push(name); stored.delete(name); } };
  globalThis.document = {
    querySelector: () => scripts[0] || null,
    createElement: () => ({ attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }),
    head: { appendChild: script => scripts.push(script) },
    set cookie(value) { if (cookiesBlocked) throw Error('blocked'); cookieWrites.push(value); },
  };
  return { scripts, removals, cookieWrites, stored };
}
afterEach(() => { delete globalThis.window; delete globalThis.document; delete globalThis.localStorage; });

test('production loads the supplied Cloudflare module once without Google', () => {
  const b = browser();
  initializeAnalytics(config); initializeAnalytics(config);
  assert.equal(b.scripts.length, 1);
  assert.equal(b.scripts[0].type, 'module');
  assert.equal(b.scripts[0].src, 'https://static.cloudflareinsights.com/beacon.min.js');
  assert.deepEqual(JSON.parse(b.scripts[0].attributes['data-cf-beacon']), { token: '72bb064081db4bce85c92ce54a4ce391' });
  assert.equal(window.gtag, undefined);
  assert.equal(window.dataLayer, undefined);
});
test('migration removes only this project’s old choice and exact root cookies', () => {
  const b = browser(); initializeAnalytics(config);
  assert.deepEqual(b.removals, ['notes.analytics-consent']);
  assert.deepEqual([...b.stored], [['reader-preference', 'keep']]);
  assert.deepEqual(b.cookieWrites, [
    '_ga=; Max-Age=0; path=/', '_ga=; Max-Age=0; path=/; domain=notes.irideas.pro',
    '_ga_33MD6529TF=; Max-Age=0; path=/', '_ga_33MD6529TF=; Max-Age=0; path=/; domain=notes.irideas.pro',
  ]);
});
test('preview origin neither loads a beacon nor touches storage', () => {
  const b = browser({ preview: true }); initializeAnalytics(config);
  assert.deepEqual(b.scripts, []); assert.deepEqual(b.removals, []); assert.deepEqual(b.cookieWrites, []);
});
test('404 still cleans retired storage without counting a visit', () => {
  const b = browser(); initializeAnalytics({ ...config, enabled: false });
  assert.equal(b.scripts.length, 0);
  assert.deepEqual(b.removals, ['notes.analytics-consent']);
});
test('blocked local storage or cookies do not break beacon loading', () => {
  const b = browser({ storageBlocked: true, cookiesBlocked: true }); initializeAnalytics(config);
  assert.equal(b.scripts.length, 1);
});
