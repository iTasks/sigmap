#!/usr/bin/env node
'use strict';

/**
 * Windows path normalization verification tests.
 *
 * Tests that path normalization works correctly for:
 *  1. Mixed case paths (Windows paths can have any case)
 *  2. Backslash separators (Windows uses \ instead of /)
 *  3. Cross-platform consistency (lowercase normalization)
 *  4. Graph building with normalized paths
 *  5. Dependency resolution across case-insensitive lookups
 */

const assert = require('assert');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { build, buildFromCwd, normalizePath } = require(path.join(ROOT, 'src', 'graph', 'builder'));
const { getImpact } = require(path.join(ROOT, 'src', 'graph', 'impact'));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}: ${err.message}`);
    failed++;
  }
}

console.log('[windows-path-normalization.test.js] Cross-platform path handling');
console.log('');

// ── Test normalizePath function ──────────────────────────────────────────────

test('normalizePath: converts to lowercase', () => {
  const mixed = '/Users/Test/SRC/MODULE.JS';
  const normalized = normalizePath(mixed);
  assert.strictEqual(normalized, normalized.toLowerCase(), 'normalized path should be lowercase');
});

test('normalizePath: handles Windows backslashes', () => {
  const winPath = 'C:\\Users\\Test\\src\\module.js';
  const normalized = normalizePath(winPath);
  // On Unix, path.normalize converts \ to / but keeps forward slashes
  // On Windows, path.normalize preserves \ but then toLowerCase
  assert.strictEqual(normalized, normalized.toLowerCase(), 'normalized path should be lowercase');
});

test('normalizePath: idempotent', () => {
  const path1 = normalizePath('/Users/Test/SRC/Module.js');
  const path2 = normalizePath(path1);
  assert.strictEqual(path1, path2, 'normalizing twice should give same result');
});

// ── Test graph building with mixed case ──────────────────────────────────────

test('build: handles mixed-case filenames in fileSet', () => {
  const SCANNER = path.join(ROOT, 'src', 'security', 'scanner.js');
  const PATTERNS = path.join(ROOT, 'src', 'security', 'patterns.js');

  // Build graph with original-case paths
  const g = build([SCANNER, PATTERNS], ROOT);

  // Verify keys are normalized
  const normScanner = normalizePath(SCANNER);
  const normPatterns = normalizePath(PATTERNS);

  assert.ok(g.forward.has(normScanner), 'forward map should have scanner (normalized key)');
  assert.ok(g.reverse.has(normPatterns), 'reverse map should have patterns (normalized key)');
});

test('build: forward map values are normalized', () => {
  const SCANNER = path.join(ROOT, 'src', 'security', 'scanner.js');
  const PATTERNS = path.join(ROOT, 'src', 'security', 'patterns.js');

  const g = build([SCANNER, PATTERNS], ROOT);
  const normScanner = normalizePath(SCANNER);
  const normPatterns = normalizePath(PATTERNS);

  const deps = g.forward.get(normScanner) || [];
  assert.ok(deps.length > 0, 'scanner should have dependencies');
  assert.ok(deps.some(d => d === normPatterns || d.toLowerCase() === normPatterns),
    'deps should contain normalized patterns path');
});

// ── Test impact analysis with normalized paths ───────────────────────────────

test('getImpact: works with normalized path lookups', () => {
  const SCANNER = path.join(ROOT, 'src', 'security', 'scanner.js');
  const PATTERNS = path.join(ROOT, 'src', 'security', 'patterns.js');

  const g = build([SCANNER, PATTERNS], ROOT);
  const result = getImpact(PATTERNS, g, { cwd: ROOT });

  assert.ok(result.direct.length > 0, 'patterns should have direct importers');
  assert.ok(result.direct.some(f => f.includes('scanner')), 'scanner should be a direct importer');
});

// ── Test case-insensitive lookups ────────────────────────────────────────────

test('build: case-insensitive lookups work', () => {
  const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'impact');
  const SCANNER = path.join(FIXTURE, 'src', 'security', 'scanner.js');
  const PATTERNS = path.join(FIXTURE, 'src', 'security', 'patterns.js');

  // Create fileSet with original case
  const g = build([SCANNER, PATTERNS], ROOT);

  // All keys should be lowercase
  for (const key of g.forward.keys()) {
    assert.strictEqual(key, key.toLowerCase(), `forward key "${key}" should be lowercase`);
  }
  for (const key of g.reverse.keys()) {
    assert.strictEqual(key, key.toLowerCase(), `reverse key "${key}" should be lowercase`);
  }
});

test('normalizePath: multiple invocations consistent', () => {
  const testPath = '/Users/Dev/SRC/ModuleA/File.JS';
  const norm1 = normalizePath(testPath);
  const norm2 = normalizePath(testPath);
  const norm3 = normalizePath(testPath);

  assert.strictEqual(norm1, norm2, 'first and second normalization should match');
  assert.strictEqual(norm2, norm3, 'second and third normalization should match');
});

// ── Test Windows-style path scenario ─────────────────────────────────────────

test('normalizePath: simulates Windows path case-insensitivity', () => {
  // Simulate Windows paths with different cases
  const paths = [
    '/src/Helpers/Utils.JS',
    '/SRC/helpers/utils.js',
    '/Src/Helpers/Utils.js'
  ];

  const normalized = paths.map(normalizePath);

  // All should normalize to the same thing (lowercase)
  assert.strictEqual(normalized[0], normalized[1], 'different cases should normalize same');
  assert.strictEqual(normalized[1], normalized[2], 'different cases should normalize same');
});

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
