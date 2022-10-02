import { jest } from '@jest/globals';
import exp from 'constants';
import Process from './index.js';
// import Process from './dist/index.cjs';
// const Process = require('./dist/index.cjs');

describe('Process', () => {
  describe('#constructor', () => {
    describe('when steps are undefined', () => {
      test('should do nothing', () => {
        expect(() => {
          new Process();
        }).not.toThrow();
      });

      describe('when executed', () => {
        test('should return passed arguments', async () => {
          const process = new Process();
          await expect(process.start({ prop: 123 })).resolves.toEqual({ prop: 123 });
        });
      });
    });

    describe('when steps are valid', () => {
      describe('when function is passed', () => {
        test('should create a Process instance', () => {
          const process = new Process(() => {});
          expect(process).toBeInstanceOf(Process);
        });
      });

      describe('when a Process instance is passed', () => {
        test('should create a Process instance', () => {
          const operation = new Process([() => {}, () => {}]);
          const process = new Process(operation);
          expect(process).toBeInstanceOf(Process);
        });
      });

      describe('when a Promise instance is passed', () => {
        test('should create a Process instance', () => {
          const process = new Process(Promise.resolve());
          expect(process).toBeInstanceOf(Process);
        });
      });

      describe('when array of functions or processes is passed', () => {
        test('should create a Process instance', () => {
          const operation = new Process(
            () => {},
            () => {}
          );
          const process = new Process([() => {}, operation, Promise.resolve()]);
          expect(process).toBeInstanceOf(Process);
        });
      });
    });

    describe('when steps are invalid', () => {
      describe('when number is passed', () => {
        test('should throw InstantiationError', () => {
          expect.assertions(2);
          try {
            new Process(3);
          } catch (error) {
            expect(error.name).toEqual(Process.InstantiationError);
            expect(error.message).toEqual('Invalid operation type: number');
          }
        });
      });

      describe('when null is passed', () => {
        test('should throw InstantiationError', () => {
          expect.assertions(2);
          try {
            new Process(null);
          } catch (error) {
            expect(error.name).toEqual(Process.InstantiationError);
            expect(error.message).toEqual('Invalid operation type: null');
          }
        });
      });

      describe('when string is passed', () => {
        test('should throw InstantiationError', () => {
          expect.assertions(2);
          try {
            new Process('string');
          } catch (error) {
            expect(error.name).toEqual(Process.InstantiationError);
            expect(error.message).toEqual('Invalid operation type: string');
          }
        });
      });

      describe('when array is passed', () => {
        test('should throw InstantiationError', () => {
          expect.assertions(2);
          try {
            new Process([() => {}, 'string']);
          } catch (error) {
            expect(error.name).toEqual(Process.InstantiationError);
            expect(error.message).toEqual('Invalid operation type: string');
          }
        });
      });
    });

    test('should create an extended instance of Promise', () => {
      const process = new Process(() => {});
      expect(process).toBeInstanceOf(Promise);
      expect(process).toBeInstanceOf(Process);
      expect(String(process)).toEqual('[object Process]');
    });
  });

  describe('Process.noop', () => {
    test('should be a promise', () => {
      expect(Process.noop).toEqual(expect.any(Promise));
    });
    test('should resolve to undefined', () => {
      expect(Process.noop).resolves.toBeUndefined();
    });
    describe('when used', () => {
      test('should do nothing and return passed arguments', async () => {
        expect.assertions(2);
        const result1 = await new Process(Process.noop).start({ a: 1 });
        const result2 = await new Process(Process.noop, Process.noop).start({ b: 2 });
        expect(result1).toEqual({ a: 1 });
        expect(result2).toEqual({ b: 2 });
      });
    });
  });

  describe('Process.exit', () => {
    test('should be a promise', () => {
      expect(Process.exit).toEqual(expect.any(Promise));
    });
    test('should resolve to undefined', () => {
      expect(Process.exit).resolves.toEqual({ exit: true });
    });
    describe('when used', () => {
      test('should interrupt the process and return passed arguments', async () => {
        expect.assertions(3);
        const operation = jest.fn();
        const result1 = await new Process(Process.exit).start({ a: 1 });
        const result2 = await new Process(Process.noop, Process.exit, operation).start({ b: 2 });
        expect(result1).toEqual({ a: 1 });
        expect(result2).toEqual({ b: 2 });
        expect(operation).not.toHaveBeenCalled();
      });
    });
  });
});
