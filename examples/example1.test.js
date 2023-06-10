// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';

jest.spyOn(global.console, 'log');
// eslint-disable-next-line import/first
import example from './example1.js';

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
    expect.assertions(5);
    await example;
    expect(consoleLog).toHaveBeenCalledTimes(4);
    expect(consoleLog.mock.calls[0]).toEqual(['step1']);
    expect(consoleLog.mock.calls[1]).toEqual(['step2']);
    expect(consoleLog.mock.calls[2]).toEqual(['step3']);
    expect(consoleLog.mock.calls[3]).toEqual(['step4']);
  });
});
