// import { jest } from '@jest/globals';
import { steps, noop, exit } from './index.js';
// import { steps, noop, exit } from './dist/index.cjs';
// const { steps, noop, exit } = require('./dist/index.cjs');

describe('noop', () => {
  test('should return promise', () => {
    expect(noop()).toEqual(expect.any(Promise));
  });
  test('should resolve to undefined', () => {
    expect(noop()).resolves.toBeUndefined();
  });
});

describe('exit', () => {
  test('should return promise', () => {
    expect(exit()).toEqual(expect.any(Promise));
  });
  test('should resolve to undefined', () => {
    expect(exit()).resolves.toEqual({ exit: true });
  });
});
