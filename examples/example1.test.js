// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';

jest.spyOn(global.console, 'log');
// eslint-disable-next-line import/first
import example from './example1.js';

describe('Examples', () => {
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 1', async () => {
    expect.assertions(5);
    const value = await example;
    expect(console.log).toHaveBeenCalledTimes(4);
    expect(console.log.mock.calls[0]).toEqual(['step1']);
    expect(console.log.mock.calls[1]).toEqual(['step2']);
    expect(console.log.mock.calls[2]).toEqual(['step3']);
    expect(console.log.mock.calls[3]).toEqual(['step4']);
  });
});
