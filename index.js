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
      if (operation instanceof Process || typeof operation === 'function') {
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
      let exitProcess;
      resolve(
        await steps.reduce(async (prevStep, /** @type Process */ operation) => {
          const prevResult = await prevStep;
          if (exitProcess) return prevResult;

          const result = await operation.start(prevResult);
          const { exit, ...rest } = result || {};
          if (exit) exitProcess = true;
          return { ...rest, ...result };
        }, Promise.resolve(args))
      );
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
