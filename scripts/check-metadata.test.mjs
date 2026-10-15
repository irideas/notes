import test from 'node:test';
import assert from 'node:assert/strict';
import { isDate, isInstant, isActor, localDay, metadataErrors } from '../src/lib/content-metadata.mjs';

test('timestamps reject impossible dates, times and unknown/missing offsets', () => {
  for (const invalid of ['2026-02-30T12:00:00+08:00','2026-10-15T24:00:00+08:00','2026-10-15T12:60:00Z','2026-10-15T12:00:00','2026-10-15T12:00:00-00:00','2026-10-15T12:00:00+24:00']) assert.equal(isInstant(invalid),false,invalid);
  assert.ok(isInstant('2024-02-29T12:00:00+08:00'));
  assert.ok(isInstant('2026-10-15T04:00:00Z'));
  assert.equal(isDate('2026-02-29'),false);
});
test('display day follows Shanghai across the UTC day boundary', () => {
  assert.equal(localDay('2026-10-14T20:30:00Z'),'2026-10-15');
});
test('content can be finalized before publication and before its first Git record', () => {
  assert.deepEqual(metadataErrors({date:'2026-10-15',first_recorded_at:'2026-10-15T12:00:00+08:00',first_recorded_commit:'a'.repeat(40),generated:{by:'human:editor',at:'2026-10-14T11:00:00+08:00'}}),[]);
});
test('known creation and modification compare instants rather than offset strings', () => {
  assert.deepEqual(metadataErrors({created_at:'2026-10-15T12:00:00+08:00',generated:{at:'2026-10-15T05:00:00Z'}}),[]);
  assert.ok(metadataErrors({created_at:'2026-10-15T12:00:00+08:00',generated:{at:'2026-10-15T03:00:00Z'}}).length);
});
test('historical evidence and known creation are distinct alternatives', () => {
  assert.ok(metadataErrors({}).length);
  assert.ok(metadataErrors({created_at:'2026-10-15T12:00:00+08:00',first_recorded_at:'2026-10-15T13:00:00+08:00'}).length);
  assert.ok(metadataErrors({first_recorded_at:'2026-10-15T13:00:00+08:00'}).length);
});
test('source IDs and the primary source cannot silently diverge', () => {
  const base={created_at:'2026-10-15T12:00:00+08:00'};
  assert.ok(metadataErrors({...base,sources:[{id:'same'},{id:'same'}]}).length);
  assert.ok(metadataErrors({...base,primary_source:'missing',sources:[{id:'present'}]}).length);
});
test('production identity is explicit without guessing a human reviewer', () => {
  for (const actor of ['human:editor','process:editorial','codex/unknown-version']) assert.ok(isActor(actor));
  for (const actor of ['editor','codex','human:','agent tool/v1']) assert.equal(isActor(actor),false);
});
