import assert from 'node:assert/strict';
import test from 'node:test';
import { canSkipVercelBuild } from './vercel-ignore-build.mjs';

test('produkt- og runtimeendringer krever Vercel-bygg', () => {
  for (const file of [
    'src/app/page.tsx',
    'src/data/slowgeo-candidates.json',
    'public/geotia-assets/logo.svg',
    'content/geoguessr-tips/tips.json',
    'next.config.ts',
    'package.json',
    'package-lock.json',
    'vercel.json',
  ]) {
    assert.equal(canSkipVercelBuild([file]), false, `${file} må bygge`);
  }
});

test('arbeids- og kontrollfiler kan gå til GitHub uten Vercel-bygg', () => {
  for (const file of [
    'README.md',
    'AGENTS.md',
    'CHANGELOG.md',
    '_lokalt/geoversitetet/README.md',
    '.github/workflows/slowgeo-refill.yml',
    'scripts/finish.ps1',
    'scripts/slowgeo-refill.mjs',
    'scripts/vercel-ignore-build.test.mjs',
  ]) {
    assert.equal(canSkipVercelBuild([file]), true, `${file} skal kunne hoppe over`);
  }
});

test('blandet commit bygger hvis minst én produktfil er endret', () => {
  assert.equal(canSkipVercelBuild(['README.md', 'src/app/page.tsx']), false);
  assert.equal(canSkipVercelBuild(['README.md', '_lokalt/prototype.md']), true);
  assert.equal(canSkipVercelBuild([]), false);
  assert.equal(canSkipVercelBuild(null), false);
});
