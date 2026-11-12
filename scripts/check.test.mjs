import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test('repository contains the precheck files', () => {
  for (const path of ['package.json', 'compose.yaml', 'src/main.ts', 'src/check.controller.ts', 'src/check.service.ts', 'src/entities.ts', 'scripts/check.mjs']) {
    assert.ok(existsSync(join(root, path)), `${path} is missing`);
  }
});

test('package constraints match the interview specification', () => {
  const p = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.match(p.engines.node, /26/);
  assert.match(p.dependencies['@nestjs/core'], /^11\./);
  assert.match(p.dependencies.typeorm, /^0\.3\./);
  assert.match(p.devDependencies.typescript, /^5\.9\./);
  assert.equal(p.scripts.check, 'node scripts/check.mjs');
});

test('database binds to loopback and has a healthcheck', () => {
  const compose = readFileSync(join(root, 'compose.yaml'), 'utf8');
  assert.match(compose, /127\.0\.0\.1:55432:5432/);
  assert.match(compose, /pg_isready/);
});

test('test performs a real TypeORM join over two entities', () => {
  const svc = readFileSync(join(root, 'src/check.service.ts'), 'utf8');
  assert.match(svc, /innerJoin\('customer\.purchases', 'purchase'\)/);
  assert.match(svc, /\.getRawMany/);
});
