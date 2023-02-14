// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import Process from '../index.js';

jest.spyOn(global.console, 'log');
// eslint-disable-next-line import/first
import example from './example4.js';

describe('Examples', () => {
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 1', async () => {
    expect.assertions(7);
    await example;
    expect(console.log.mock.calls[0]).toEqual(['item loaded']);
    expect(console.log.mock.calls[1]).toEqual(['item needs update']);
    expect(console.log.mock.calls[2]).toEqual(['item published']);
    expect(console.log.mock.calls[3]).toEqual(['subscribers notified']);
    expect(console.log.mock.calls[4]).toEqual(['item updated']);
    expect(console.log.mock.calls[5]).toEqual([{ id: 'item-id', state: 'published' }]);
    expect(console.log).toHaveBeenCalledTimes(6);
  });
});
