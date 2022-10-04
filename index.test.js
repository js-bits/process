import { jest } from '@jest/globals';
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
          expect.assertions(1);
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

  describe('Process#start', () => {
    describe('when functions are used', () => {
      test('should be able pass execution results through the process', async () => {
        expect.assertions(1);
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        operation1.mockReturnValue({ operation1Result: 444 }); // regular function
        operation2.mockReturnValue(Promise.resolve({ operation2Result: 555 })); // async function
        const process = new Process(operation1, operation2);
        const result = await process.start({ input: 1 });
        expect(result).toEqual({ input: 1, operation1Result: 444, operation2Result: 555 });
      });

      describe('when functions throws an error', () => {
        test('should be able pass execution results through the process', async () => {
          expect.assertions(3);
          const operation1 = jest.fn();
          const operation2 = jest.fn();
          const testError = new Error('sync error');
          operation1.mockImplementation(() => {
            throw testError;
          });
          operation2.mockReturnValue(Promise.resolve({ operation2Result: 555 })); // async function
          const process = new Process(operation1, operation2);
          let result = 'unchanged';
          try {
            result = await process.start({ input: 1 });
          } catch (error) {
            expect(error).toBe(testError);
          }
          expect(operation2).not.toHaveBeenCalled();
          expect(result).toEqual('unchanged');
        });
      });
    });

    describe('when promises are used', () => {
      test('should be able pass execution results through the process', async () => {
        const operation1 = Promise.resolve({ operation1Result: 222 });
        const operation2 = Promise.resolve({ operation2Result: 333 });
        const process = new Process(operation1, Process.noop, operation2);
        const result = await process.start({ input: 111 });
        expect(result).toEqual({ input: 111, operation1Result: 222, operation2Result: 333 });
      });
      describe('when functions throws an error', () => {
        test('should be able pass execution results through the process', done => {
          expect.assertions(3);
          const operation1 = jest.fn();
          const operation2 = jest.fn();
          const testError = new Error('async error');
          operation1.mockImplementation(async () => Promise.reject(testError)); // async function
          operation2.mockReturnValue(Promise.resolve({ operation2Result: 333 })); // async function
          const process = new Process(operation1, Process.noop, operation2);
          let result = 'unchanged';
          process
            .start({ input: 111 })
            .then(value => {
              result = value;
            })
            .catch(error => {
              expect(error).toBe(testError);
              done();
            });
          expect(result).toEqual('unchanged');
          expect(operation2).not.toHaveBeenCalled();
        });
      });
    });

    describe('when another process are used', () => {
      test('should be able pass execution results through the process', async () => {
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        operation1.mockReturnValue({ op1: 44 }); // regular function
        operation2.mockReturnValue(Promise.resolve({ op2: 55 })); // async function
        const process = new Process(Promise.resolve({ promise1: 22 }), Process.noop, operation2);
        const result = await new Process(operation1, process, Promise.resolve({ promise2: 33 })).start({ input: 11 });
        expect(result).toEqual({ input: 11, op1: 44, op2: 55, promise1: 22, promise2: 33 });
      });
    });

    describe('when an array are used', () => {
      test('should be able pass execution results through the process', async () => {
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        operation1.mockReturnValue({ op1: 44 }); // regular function
        operation2.mockReturnValue(Promise.resolve({ op2: 55 })); // async function
        const result = await new Process(
          operation1,
          [Promise.resolve({ promise1: 22 }), Process.noop, operation2],
          Promise.resolve({ promise2: 33 })
        ).start({ input: 11 });
        expect(result).toEqual({ input: 11, op1: 44, op2: 55, promise1: 22, promise2: 33 });
      });
    });

    describe('when exit:true is returned', () => {
      test('should interrupt the process', async () => {
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        operation1.mockReturnValue({ op1: 4 });
        operation2.mockReturnValue({ op2: 5, exit: true });
        const result = await new Process(
          operation1,
          Process.noop,
          [Promise.resolve({ promise1: 2 }), operation2],
          Promise.resolve({ promise2: 3 })
        ).start({ input: 0 });
        expect(result).toEqual({ input: 0, op1: 4, op2: 5, promise1: 2, exit: true });
      });
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
        expect(result1).toEqual({ a: 1, exit: true });
        expect(result2).toEqual({ b: 2, exit: true });
        expect(operation).not.toHaveBeenCalled();
      });
    });
  });
});
