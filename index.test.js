import { jest } from '@jest/globals';
import { Executor } from '@js-bits/executor';
import Process from './index.js';
// import Process from './dist/index.cjs';
// const Process = require('./dist/index.cjs');

const [EXIT_CODE] = Object.getOwnPropertySymbols(Process.exit());

describe('Process', () => {
  describe('#constructor', () => {
    describe('when steps are undefined', () => {
      test('should do nothing', () => {
        expect(() => {
          new Process();
        }).not.toThrow();
      });

      describe('when executed', () => {
        test('should return undefined', async () => {
          expect.assertions(1);
          const process = new Process();
          await expect(process.start({ prop: 123 })).resolves.toBeUndefined();
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
        test('should throw InitializationError', () => {
          expect.assertions(2);
          try {
            new Process(3);
          } catch (error) {
            expect(error.name).toEqual(Process.InitializationError);
            expect(error.message).toEqual('Invalid "OPERATION" type: number');
          }
        });
      });

      describe('when null is passed', () => {
        test('should throw InitializationError', () => {
          expect.assertions(2);
          try {
            new Process(null);
          } catch (error) {
            expect(error.name).toEqual(Process.InitializationError);
            expect(error.message).toEqual('Invalid "OPERATION" type: null');
          }
        });
      });

      describe('when string is passed', () => {
        test('should throw InitializationError', () => {
          expect.assertions(2);
          try {
            new Process('string');
          } catch (error) {
            expect(error.name).toEqual(Process.InitializationError);
            expect(error.message).toEqual('Invalid "OPERATION" type: string');
          }
        });
      });

      describe('when array is passed', () => {
        test('should throw InitializationError', () => {
          expect.assertions(2);
          try {
            new Process([() => {}, 'string']);
          } catch (error) {
            expect(error.name).toEqual(Process.InitializationError);
            expect(error.message).toEqual('Invalid "OPERATION" type: string');
          }
        });
      });
    });

    test('should create an instance of Executor', () => {
      const process = new Process(() => {});
      expect(process).toBeInstanceOf(Promise);
      expect(process).toBeInstanceOf(Executor);
      expect(process).toBeInstanceOf(Process);
      expect(String(process)).toEqual('[object Process]');
    });
  });

  describe('Process#start', () => {
    describe('when called without input', () => {
      test('should use empty object as input', async () => {
        expect.assertions(3);
        const operation = jest.fn();
        operation.mockReturnValue({ result: 444 });
        const process = new Process(operation);
        const result = await process.start();
        expect(operation).toHaveBeenCalledTimes(1);
        expect(operation).toHaveBeenCalledWith({});
        expect(result).toEqual({ result: 444 });
      });
    });

    describe('when functions are used', () => {
      test('should be able pass execution results through the process', async () => {
        expect.assertions(5);
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        operation1.mockReturnValue({ operation1Result: 444 }); // regular function
        operation2.mockReturnValue(Promise.resolve({ operation2Result: 555 })); // async function
        const process = new Process(operation1, operation2);
        const result = await process.start({ input: 1 });
        expect(operation1).toHaveBeenCalledTimes(1);
        expect(operation1).toHaveBeenCalledWith({ input: 1 });
        expect(operation2).toHaveBeenCalledTimes(1);
        expect(operation2).toHaveBeenCalledWith({ input: 1, operation1Result: 444 });
        expect(result).toEqual({ operation1Result: 444, operation2Result: 555 });
      });

      describe('when the same property is returned by different steps', () => {
        test('should throw an error', async () => {
          expect.assertions(5);
          const operation1 = jest.fn();
          const operation2 = jest.fn();
          const operation3 = jest.fn();
          operation1.mockReturnValue({ operationResult: 444, out: 1 }); // regular function
          operation2.mockReturnValue(Promise.resolve({ operationResult: 555, out: 2 })); // async function
          const process = new Process(operation1, operation2, operation3);
          let result = 'unchanged';
          try {
            result = await process.start({ input: 1 });
          } catch (e) {
            expect(e).toEqual(expect.any(Error));
            expect(e.message).toEqual('Conflicting step results for: "operationResult", "out"');
            expect(e.name).toEqual('Process|ExecutionError');
          }
          expect(operation3).not.toHaveBeenCalled();
          expect(result).toEqual('unchanged');
          return result;
        });
      });

      describe('when functions throws an error', () => {
        test('should reject with the error', async () => {
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
        expect(result).toEqual({ operation1Result: 222, operation2Result: 333 });
      });
      describe('when functions throw an error', () => {
        test('should reject with the error', done => {
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
        expect.assertions(3);
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        operation1.mockReturnValue({ op1: 44 }); // regular function
        operation2.mockReturnValue(Promise.resolve({ op2: 55 })); // async function
        const process = new Process(Promise.resolve({ promise1: 22 }), Process.noop, operation2);
        const result = await new Process(operation1, process, Promise.resolve({ promise2: 33 })).start({ input: 11 });
        expect(operation2).toHaveBeenCalledTimes(1);
        expect(operation2).toHaveBeenCalledWith({ input: 11, op1: 44, promise1: 22 });
        expect(result).toEqual({ op1: 44, op2: 55, promise1: 22, promise2: 33 });
      });
    });

    describe('when an array are used', () => {
      test('should be able pass execution results through the process', async () => {
        expect.assertions(3);
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        operation1.mockReturnValue({ op1: 55 }); // regular function
        operation2.mockReturnValue(Promise.resolve({ op2: 66 })); // async function
        const result = await new Process(
          operation1,
          [Promise.resolve({ promise1: 222 }), Process.noop, operation2],
          Promise.resolve({ promise2: 333 })
        ).start({ input: 13 });
        expect(operation2).toHaveBeenCalledTimes(1);
        expect(operation2).toHaveBeenCalledWith({ input: 13, op1: 55, promise1: 222 });
        expect(result).toEqual({ op1: 55, op2: 66, promise1: 222, promise2: 333 });
      });
    });

    describe('when exit code is returned', () => {
      test('should interrupt the process', async () => {
        expect.assertions(2);
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        const operation3 = jest.fn();
        operation1.mockReturnValue({ op1: 4 });
        operation2.mockReturnValue({ op2: 5, [EXIT_CODE]: true });
        const result = await new Process(
          operation1,
          Process.noop,
          [Promise.resolve({ promise1: 2 }), operation2],
          operation3,
          Promise.resolve({ promise2: 3 })
        ).start({ input: 0 });
        expect(result).toEqual({ op1: 4, op2: 5, promise1: 2, [EXIT_CODE]: true });
        expect(operation3).not.toHaveBeenCalled();
      });
    });

    describe('when argument is invalid', () => {
      describe('null', () => {
        test('should throw ExecutionError error', () => {
          expect.assertions(2);
          try {
            new Process().start(null);
          } catch (error) {
            expect(error.name).toEqual('Process|ExecutionError');
            expect(error.message).toEqual('Invalid "INPUT" type: null');
          }
        });
      });
      describe('object', () => {
        test('should throw ExecutionError error', () => {
          expect.assertions(2);
          try {
            new Process().start(new Promise(() => {}));
          } catch (error) {
            expect(error.name).toEqual('Process|ExecutionError');
            expect(error.message).toEqual('Invalid "INPUT" type: [object Promise]');
          }
        });
      });
    });

    describe('when operation return is invalid', () => {
      describe('when boolean', () => {
        test('should throw ExecutionError error', async () => {
          expect.assertions(3);
          const operation1 = Promise.resolve(true);
          const operation2 = jest.fn();
          const process = new Process(operation1, Process.noop, operation2);
          try {
            await process.start({ input: 111 });
          } catch (error) {
            expect(error.name).toEqual('Process|ExecutionError');
            expect(error.message).toEqual('Invalid "OUTPUT" type: boolean');
          }
          expect(operation2).not.toHaveBeenCalled();
        });
      });
      describe('when null', () => {
        test('should throw ExecutionError error', async () => {
          expect.assertions(2);
          const operation1 = Promise.resolve(null);
          const process = new Process(operation1);
          try {
            await process.start();
          } catch (error) {
            expect(error.name).toEqual('Process|ExecutionError');
            expect(error.message).toEqual('Invalid "OUTPUT" type: null');
          }
        });
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
      test('should do nothing and return empty object', async () => {
        expect.assertions(2);
        const result1 = await new Process(Process.noop).start({ a: 1 });
        const result2 = await new Process(Process.noop, Process.noop).start({ b: 2 });
        expect(result1).toEqual({});
        expect(result2).toEqual({});
      });
    });
  });

  describe('Process.exit', () => {
    test('should be a function', () => {
      expect(Process.exit).toEqual(expect.any(Function));
    });
    test('should return an exit code', () => {
      const result = Process.exit();
      const symbols = Object.getOwnPropertySymbols(result);
      expect(symbols).toHaveLength(1);
      expect(String(symbols[0])).toEqual('Symbol(exit)');
      expect(result[symbols[0]]).toBe(true);
    });
    describe('when used as a step', () => {
      test('should interrupt the process and return empty object', async () => {
        expect.assertions(4);
        const operation1 = jest.fn();
        const operation2 = jest.fn();
        const result1 = await new Process(Process.exit).start({ a: 1 });
        const result2 = await new Process(Process.noop, operation1, Process.exit, operation2).start({ b: 2 });
        expect(result1).toEqual({ [EXIT_CODE]: true });
        expect(result2).toEqual({ [EXIT_CODE]: true });
        expect(operation1).toHaveBeenCalledTimes(1);
        expect(operation2).not.toHaveBeenCalled();
      });
    });
    describe('when used as a return value', () => {
      describe('when returned', () => {
        test('should interrupt the process and return passed object', async () => {
          expect.assertions(5);
          const operation1 = jest.fn();
          const operation2 = jest.fn();
          const operation3 = jest.fn();
          operation2.mockImplementation(() => Process.exit);
          const result = await new Process(operation1, operation2, operation3).start({ b: 2 });
          expect(result).toEqual({ [EXIT_CODE]: true });
          expect(operation1).toHaveBeenCalledTimes(1);
          expect(operation2).toHaveBeenCalledTimes(1);
          expect(operation2).toHaveBeenCalledWith({ b: 2 });
          expect(operation3).not.toHaveBeenCalled();
        });
      });
      describe('when executed', () => {
        test('should interrupt the process and return passed object', async () => {
          expect.assertions(5);
          const operation1 = jest.fn();
          const operation2 = jest.fn();
          const operation3 = jest.fn();
          operation2.mockImplementation(() => Process.exit({ status: 'interrupted' }));
          const result = await new Process(operation1, operation2, operation3).start({ b: 2 });
          expect(result).toEqual({ [EXIT_CODE]: true, status: 'interrupted' });
          expect(operation1).toHaveBeenCalledTimes(1);
          expect(operation2).toHaveBeenCalledTimes(1);
          expect(operation2).toHaveBeenCalledWith({ b: 2 });
          expect(operation3).not.toHaveBeenCalled();
        });

        describe('when executed with invalid output', () => {
          test('should throw an error', async () => {
            expect.assertions(2);
            const operation1 = jest.fn();
            const operation2 = jest.fn();
            const operation3 = jest.fn();
            operation2.mockImplementation(() => Process.exit(123));
            try {
              await new Process(operation1, operation2, operation3).start({ b: 2 });
            } catch (error) {
              expect(error.name).toEqual('Process|ExecutionError');
              expect(error.message).toEqual('Invalid "OUTPUT" type: number');
            }
          });
        });
      });
    });
  });

  describe('Process.steps', () => {
    test('should return a function', () => {
      expect(Process.steps()).toEqual(expect.any(Function));
    });
    describe('when called', () => {
      test('should return a new Process each time', () => {
        const process1 = Process.steps(() => {})({});
        const process2 = Process.steps(() => {})({});
        expect(process1).toEqual(expect.any(Process));
        expect(process2).toEqual(expect.any(Process));
        expect(process1).not.toBe(process2);
      });
    });
    describe('when used', () => {
      test('should interrupt the process and return empty object', async () => {
        expect.assertions(4);
        const step1 = jest.fn();
        const step2 = jest.fn();
        step1.mockReturnValue({ step1: true });
        step2.mockReturnValue({ step2: true });
        const operation = Process.steps(step1, step2);
        const result1 = await new Process(operation).start({ call: 1 });
        const result2 = await new Process(operation).start({ call: 2 });
        expect(result1).toEqual({ step1: true, step2: true });
        expect(result2).toEqual({ step1: true, step2: true });
        expect(step1).toHaveBeenCalledTimes(2);
        expect(step2).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Process.switch', () => {
    test('should return a function', () => {
      expect(Process.switch('key', {})).toEqual(expect.any(Function));
    });
    describe('when called', () => {
      test('should return a new Process each time', () => {
        const process1 = Process.switch('key', {})({});
        const process2 = Process.switch('key', {})({});
        expect(process1).toEqual(expect.any(Process));
        expect(process2).toEqual(expect.any(Process));
        expect(process1).not.toBe(process2);
      });
    });
    describe('when used', () => {
      test('should switch between available options', async () => {
        expect.assertions(8);
        const option1 = jest.fn();
        const option2 = jest.fn();
        const option3 = jest.fn();
        option1.mockReturnValue({ option1: true });
        option2.mockReturnValue({ option2: true });
        option3.mockReturnValue({ option3: true });
        const result1 = await new Process(
          Process.switch('option3', {
            option1,
            option2,
            option3,
          })
        ).start({ call: 1 });
        expect(result1).toEqual({ option3: true });
        expect(option1).toHaveBeenCalledTimes(0);
        expect(option2).toHaveBeenCalledTimes(0);
        expect(option3).toHaveBeenCalledTimes(1);
        const result2 = await new Process(
          Process.switch('option1', {
            option1,
            option2,
            option3,
          })
        ).start({ call: 2 });
        expect(result2).toEqual({ option1: true });
        expect(option1).toHaveBeenCalledTimes(1);
        expect(option2).toHaveBeenCalledTimes(0);
        expect(option3).toHaveBeenCalledTimes(1);
      });

      describe('when exit code is returned', () => {
        test('should switch exit the process', async () => {
          expect.assertions(5);
          const operation1 = jest.fn();
          const operation2 = jest.fn();
          operation1.mockReturnValue({ operation1: true });
          operation2.mockReturnValue({ operation2: true });
          const option1 = jest.fn();
          const option3 = jest.fn();
          option1.mockReturnValue({ option1: true });
          option3.mockReturnValue({ option3: true });
          const result1 = await new Process(
            operation1,
            Process.switch('option2', {
              option1,
              option2: Process.exit,
              option3,
            }),
            operation2
          ).start({ call: 1 });
          expect(result1).toEqual({ operation1: true, [EXIT_CODE]: true });
          expect(operation1).toHaveBeenCalledTimes(1);
          expect(option1).toHaveBeenCalledTimes(0);
          expect(option3).toHaveBeenCalledTimes(0);
          expect(operation2).toHaveBeenCalledTimes(0);
        });
      });

      describe('when default action is provided', () => {
        test("should use is other options don't match", async () => {
          expect.assertions(3);
          const option1 = Process.noop;
          const option2 = jest.fn();
          const defaultOption = jest.fn();
          option2.mockReturnValue({ option2: true });
          defaultOption.mockReturnValue({ defaultOption: true });
          const result1 = await new Process(
            Process.switch(
              'unknown',
              {
                option1,
                option2,
              },
              defaultOption
            )
          ).start({ call: 1 });
          expect(result1).toEqual({ defaultOption: true });
          expect(option2).toHaveBeenCalledTimes(0);
          expect(defaultOption).toHaveBeenCalledTimes(1);
        });
        describe('when defaultOption argument is invalid', () => {
          test('should throw InitializationError error', () => {
            expect.assertions(2);
            try {
              Process.switch('', {}, 123)({});
            } catch (error) {
              expect(error.name).toEqual('Process|InitializationError');
              expect(error.message).toEqual('Invalid "OPERATION" type: number');
            }
          });
        });
      });
    });
    describe('when key argument is invalid', () => {
      test('should throw InitializationError error', () => {
        expect.assertions(2);
        try {
          Process.switch(123, 123);
        } catch (error) {
          expect(error.name).toEqual('Process|InitializationError');
          expect(error.message).toEqual('Invalid "SWITCH_KEY" type: number');
        }
      });
    });
    describe('when options argument is invalid', () => {
      describe('null', () => {
        test('should throw InitializationError error', () => {
          expect.assertions(2);
          try {
            Process.switch('', null);
          } catch (error) {
            expect(error.name).toEqual('Process|InitializationError');
            expect(error.message).toEqual('Invalid "SWITCH_OPTIONS" type: null');
          }
        });
      });
      describe('object', () => {
        test('should throw InitializationError error', () => {
          expect.assertions(2);
          try {
            Process.switch('', new Promise(() => {}));
          } catch (error) {
            expect(error.name).toEqual('Process|InitializationError');
            expect(error.message).toEqual('Invalid "SWITCH_OPTIONS" type: [object Promise]');
          }
        });
      });
    });
  });
});
