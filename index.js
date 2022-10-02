import enumerate from '@js-bits/enumerate';
import { Executor } from '@js-bits/executor';

const { Prefix } = enumerate;

const ERRORS = enumerate(Prefix('Process|'))`
  InstantiationError
`;

class Process extends Executor {
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Process';
  }

  constructor(...input) {
    // wrap into processes
    const steps = input.map(operation => {
      if (operation instanceof Process || operation instanceof Promise || typeof operation === 'function') {
        return operation;
      }
      if (Array.isArray(operation)) {
        return new Process(...operation);
      }
      const error = new Error(`Invalid operation type: ${operation === null ? 'null' : typeof operation}`);
      error.name = Process.InstantiationError;
      throw error;
    });

    super(async (resolve, reject, args) => {
      resolve(
        await steps.reduce(async (prevStep, operation) => {
          const prevResult = await prevStep;
          if (prevResult.exit) return prevResult;

          let result;
          if (operation instanceof Process) {
            result = await operation.start(prevResult);
          } else if (operation instanceof Promise) {
            result = await operation;
          } else if (typeof operation === 'function') {
            result = await operation(prevResult);
          }
          return { ...result, ...prevResult };
        }, Promise.resolve(args))
      );
    });
  }

  /**
   * Just an alias of {@link Executor#execute} method
   */
  start = super.execute;

  static noop = Promise.resolve();

  static exit = Promise.resolve({ exit: true });
}

Object.assign(Process, ERRORS);

export default Process;
