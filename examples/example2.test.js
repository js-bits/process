// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';

jest.spyOn(global.console, 'log');
// eslint-disable-next-line import/first
import example from './example2.js';

describe('Examples', () => {
  afterEach(() => {
    jest.resetModules();
  });

  test('Example 1', async () => {
    expect.assertions(5);
    await example;
    expect(console.log).toHaveBeenCalledTimes(4);
    expect(console.log.mock.calls[0]).toEqual([{ inputParam: 1 }]);
    expect(console.log.mock.calls[1]).toEqual([{ inputParam: 1, step1Result: 'success' }]);
    expect(console.log.mock.calls[2]).toEqual([{ inputParam: 1, step1Result: 'success', step2Result: 'success' }]);
    expect(console.log.mock.calls[3]).toEqual([
      { step1Result: 'success', step2Result: 'success', step3Result: 'success' },
    ]);
  });
});
