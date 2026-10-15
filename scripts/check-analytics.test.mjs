import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initializeAnalytics } from '../src/lib/analytics-consent.mjs';
import { google } from '../src/lib/google.mjs';

const key = 'notes.analytics-consent';
const id = google.measurementId || 'G-TESTONLY'; // Mock DOM only; no network requests.
const origin = 'https://notes.irideas.pro';
function browser({ choice = null, preview = false, storageBlocked = false, panelPresent = true } = {}) {
  const element = () => ({ hidden: true, events: {}, addEventListener(event, fn) { this.events[event] = fn; }, focus() {} });
  const settings = element(), accept = element(), deny = element(), panel = element();
  panel.dataset = { measurementId: id, productionOrigin: origin };
  panel.querySelector = selector => selector.includes('accept') ? accept : selector.includes('deny') ? deny : null;
  const scripts = [], cookies = [], stored = new Map(choice ? [[key, choice]] : []);
  let reloads = 0;
  globalThis.document = {
    getElementById: () => panelPresent ? panel : null,
    querySelector: () => settings,
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
    set cookie(value) { cookies.push(value); },
  };
  globalThis.localStorage = {
    getItem: name => { if (storageBlocked) throw Error('blocked'); return stored.get(name) || null; },
    setItem: (name, value) => { if (storageBlocked) throw Error('blocked'); stored.set(name, value); },
  };
  globalThis.window = {
    location: { origin: preview ? 'http://localhost:4321' : origin, hostname: 'notes.irideas.pro', reload: () => reloads++ },
    events: {}, addEventListener(event, fn) { this.events[event] = fn; },
  };
  initializeAnalytics();
  return { panel, settings, accept: () => accept.events.click(), deny: () => deny.events.click(), scripts, cookies, stored, reloads: () => reloads, commands: () => (window.dataLayer || []).map(args => [...args]) };
}
afterEach(() => { delete globalThis.document; delete globalThis.window; delete globalThis.localStorage; });

test('fresh visit and refusal never load Google or queue events', () => {
  const b = browser();
  assert.equal(b.panel.hidden, false);
  assert.equal(b.settings.hidden, false);
  assert.deepEqual(b.scripts, []);
  assert.deepEqual(b.commands(), []);
  b.deny();
  assert.equal(b.stored.get(key), 'denied');
  assert.equal(b.panel.hidden, true);
  assert.deepEqual(b.scripts, []);
  assert.deepEqual(b.commands(), []);
  assert.equal(b.reloads(), 0);
});
test('consent loads one tag with denied advertising and no account identity', () => {
  const b = browser();
  b.accept(); b.accept();
  assert.equal(b.scripts.length, 1);
  assert.equal(b.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${id}`);
  assert.equal(b.scripts[0].async, true);
  const [defaults, update, js, config] = b.commands();
  assert.deepEqual(defaults, ['consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' }]);
  assert.deepEqual(update, ['consent', 'update', { ...defaults[2], analytics_storage: 'granted' }]);
  assert.equal(js[0], 'js');
  assert.deepEqual(config, ['config', id, { allow_google_signals: false, allow_ad_personalization_signals: false, cookie_domain: 'notes.irideas.pro' }]);
  assert.equal(b.stored.get(key), 'granted');
});
test('saved refusal stays blocked and can be changed to consent', () => {
  const b = browser({ choice: 'denied' });
  assert.equal(b.panel.hidden, true);
  assert.equal(b.scripts.length, 0);
  b.settings.events.click();
  assert.equal(b.panel.hidden, false);
  b.deny(); b.settings.events.click(); b.accept();
  assert.equal(window['ga-disable-' + id], false);
  assert.equal(b.scripts.length, 1);
});
test('withdrawal disables collection, clears cookies and reloads without denied-mode pings', () => {
  const b = browser({ choice: 'granted' });
  const count = b.commands().length;
  b.settings.events.click(); b.deny();
  assert.equal(window['ga-disable-' + id], true);
  assert.equal(b.stored.get(key), 'denied');
  assert.equal(b.reloads(), 1);
  assert.equal(b.commands().length, count);
  assert.ok(b.cookies.some(value => value.startsWith('_ga=; Max-Age=0;')));
  assert.ok(b.cookies.some(value => value.startsWith(`_ga_${id.slice(2)}=; Max-Age=0;`)));
});
test('withdrawal or cleared preferences in another tab stops collection', () => {
  const b = browser({ choice: 'granted' });
  b.stored.delete(key);
  window.events.storage({ key: null });
  assert.equal(window['ga-disable-' + id], true);
  assert.equal(b.reloads(), 1);
});
test('blocked browser storage defaults to no collection and still permits an explicit choice', () => {
  const b = browser({ storageBlocked: true });
  assert.equal(b.scripts.length, 0);
  b.deny();
  assert.equal(b.scripts.length, 0);
  b.accept();
  assert.equal(b.scripts.length, 1);
});
test('preview hosts and pages without analytics controls cannot start collection', () => {
  assert.equal(browser({ preview: true, choice: 'granted' }).scripts.length, 0);
  assert.equal(browser({ panelPresent: false, choice: 'granted' }).scripts.length, 0);
});
