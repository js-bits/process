// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import Process from '../index.js';

jest.spyOn(global.console, 'log');
// eslint-disable-next-line import/first
import example from './example3.js';

describe('Examples', () => {
  /** @type {any} */
  let consoleLog;
  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log');
  });
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 1', async () => {
    expect.assertions(4);
    await example;
    expect(consoleLog.mock.calls[0]).toEqual(['step1']);
    expect(consoleLog.mock.calls[1]).toEqual(['step2']);
    expect(consoleLog.mock.calls[2]).toEqual([{ step1Result: 'success', ...Process.exit() }]);
    expect(consoleLog).toHaveBeenCalledTimes(3);
  });
});
