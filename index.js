import enumerate from '@js-bits/enumerate';
import { Executor } from '@js-bits/executor';

const ERRORS = enumerate(String)`
  ProcessInstantiationError
`;

class Process extends Executor {
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Process';
  }

  constructor(...steps) {
    super((resolve, reject, args) => {
      const processResult = steps.reduce(async (prevStep, operation) => {
        const prevStepResult = await prevStep;
        if (Array.isArray(operation)) {
          return new Process(...operation).start(prevStepResult);
        }
        if (typeof operation === 'function') {
          const { exit, ...rest } = prevStepResult || {};
          if (!exit) {
            const result = await operation(rest);
            return { ...rest, ...result };
          }
          return prevStepResult;
        }
        const error = new Error(`Invalid operation type: ${typeof operation}`);
        error.name = Process.ProcessInstantiationError;
        throw error;
      }, Promise.resolve(args));
      resolve(processResult);
    });
  }

  /**
   * Just an alias of {@link Executor#execute} method
   */
  start = super.execute;

  static noop = async () => {};

  static exit = async () => ({ exit: true });
}

Object.assign(Process, ERRORS);

export default Process;
