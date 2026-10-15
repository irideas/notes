import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { isDate, isInstant, isActor, localDay, metadataErrors } from '../src/lib/content-metadata.mjs';
import { coverFromBody, createdAtFor } from '../src/lib/article-source.mjs';

test('timestamps reject impossible dates and unknown/missing offsets', () => {
  for (const value of ['2026-02-30T12:00:00+08:00','2026-10-15T24:00:00+08:00','2026-10-15T12:60:00Z','2026-10-15T12:00:00','2026-10-15T12:00:00-00:00','2026-10-15T12:00:00+24:00']) assert.equal(isInstant(value),false,value);
  assert.ok(isInstant('2024-02-29T12:00:00+08:00'));
  assert.ok(isInstant('2026-10-15T04:00:00Z'));
  assert.equal(isDate('2026-02-29'),false);
});
test('display day follows Shanghai across the UTC day boundary', () => {
  assert.equal(localDay('2026-10-14T20:30:00Z'),'2026-10-15');
});
test('source IDs cannot silently collide', () => {
  assert.ok(metadataErrors({sources:[{id:'same'},{id:'same'}]}).length);
});
test('production identity accepts a tool name with an optional known model', () => {
  for (const actor of ['human:editor','process:editorial','codex','codex/gpt-6.1 sol']) assert.ok(isActor(actor),actor);
  for (const actor of ['','human:','codex/','codex/gpt\nsol','codex/model/extra','agent tool/v1']) assert.equal(isActor(actor),false,actor);
});
test('only the leading image is promoted, with standard Markdown alt and credit', async () => {
  assert.deepEqual(await coverFromBody('![Illustration](./cover.png "AI illustration")\n\nText'),{path:'./cover.png',alt:'Illustration',credit:'AI illustration'});
  assert.equal(await coverFromBody('Text\n\n![Inline image](./cover.png)'),null);
});
test('creation follows the original Git record across a rename', async () => {
  const root=await mkdtemp(join(tmpdir(),'notes-creation-test-'));
  try {
    let time='2026-10-14T12:00:00+08:00';
    const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1',GIT_AUTHOR_DATE:time,GIT_COMMITTER_DATE:time}});
    git('init','-q');
    await mkdir(join(root,'src/content/notes/2026/10'),{recursive:true});
    await writeFile(join(root,'src/content/notes/2026/10/old.md'),'Original content\n');
    git('add','.'); git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','Create fixture');
    await rename(join(root,'src/content/notes/2026/10/old.md'),join(root,'src/content/notes/2026/10/new.md'));
    time='2026-10-15T13:00:00+08:00';
    git('add','-A'); git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','Rename fixture');
    assert.equal(createdAtFor('2026/10/new',root),'2026-10-14T12:00:00+08:00');
  } finally { await rm(root,{recursive:true,force:true}); }
});
