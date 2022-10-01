// import { jest } from '@jest/globals';
import Process from './index.js';
// import { steps, noop, exit } from './dist/index.cjs';
// const { steps, noop, exit } = require('./dist/index.cjs');

describe('noop', () => {
  test('should return promise', () => {
    expect(Process.noop()).toEqual(expect.any(Promise));
  });
  test('should resolve to undefined', () => {
    expect(Process.noop()).resolves.toBeUndefined();
  });
});

describe('exit', () => {
  test('should return promise', () => {
    expect(Process.exit()).toEqual(expect.any(Promise));
  });
  test('should resolve to undefined', () => {
    expect(Process.exit()).resolves.toEqual({ exit: true });
  });
});
