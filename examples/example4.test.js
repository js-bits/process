// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import Process from '../index.js';

jest.spyOn(global.console, 'log');
// eslint-disable-next-line import/first
import example from './example4.js';

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
    expect.assertions(7);
    await example;
    expect(consoleLog.mock.calls[0]).toEqual(['item loaded']);
    expect(consoleLog.mock.calls[1]).toEqual(['item needs update']);
    expect(consoleLog.mock.calls[2]).toEqual(['item published']);
    expect(consoleLog.mock.calls[3]).toEqual(['subscribers notified']);
    expect(consoleLog.mock.calls[4]).toEqual(['item updated']);
    expect(consoleLog.mock.calls[5]).toEqual([{ id: 'item-id', state: 'published' }]);
    expect(consoleLog).toHaveBeenCalledTimes(6);
  });
});
