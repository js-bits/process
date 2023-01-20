import enumerate from '@js-bits/enumerate';
import { Executor } from '@js-bits/executor';

const { Prefix } = enumerate;

const ERRORS = enumerate(Prefix('Process|'))`
  InstantiationError
  ExecutionError
`;

const EXIT_CODE = { exit: true };

const getType = value => {
  if (value === null) return 'null';
  if (typeof value === 'object') return String(value);
  return typeof value;
};

const isObject = value => value && typeof value === 'object' && value.constructor === Object;

// fixes issues with aws-xray-sdk wrapping global Promise
const isPromise = value => value instanceof Promise || value instanceof Process.noop.constructor;

class Process extends Executor {
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Process';
  }

  constructor(...args) {
    // wrap into processes
    const steps = args.map(operation => {
      if (operation instanceof Process || isPromise(operation) || typeof operation === 'function') {
        return operation;
      }
      if (Array.isArray(operation)) {
        return new Process(...operation);
      }
      const error = new Error(`Invalid operation type: ${getType(operation)}`);
      error.name = Process.InstantiationError;
      throw error;
    });

    super(async (resolve, reject, args = {}) => {
      try {
        resolve(
          await steps.reduce(async (prevStep, operation) => {
            const prevResult = await prevStep;
            if (prevResult.exit) return prevResult;

            let result;
            if (operation instanceof Process) {
              result = await operation.start(prevResult);
            } else if (isPromise(operation)) {
              result = await operation;
            } else {
              // should be a function
              result = await operation(prevResult);
            }

            if (result !== undefined && !isObject(result)) {
              const error = new Error(`Invalid output type: ${getType(result)}`);
              error.name = Process.ExecutionError;
              throw error;
            }
            return { ...result, ...prevResult };
          }, Promise.resolve(args))
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  execute(input) {
    if (input !== undefined && !isObject(input)) {
      const error = new Error(`Invalid input type: ${getType(input)}`);
      error.name = Process.ExecutionError;
      throw error;
    }
    return super.execute(input);
  }

  /**
   * Just an alias of {@link Process#execute} method
   */
  start = this.execute;

  /**
   * Shortcut
   */
  static steps(...list) {
    return input => new Process(...list).start(input);
  }

  static switch(key, options, fallback = Process.noop) {
    let errorMessage;
    if (typeof key !== 'string') errorMessage = `Invalid "key" type: ${getType(key)}`;
    else if (!isObject(options)) errorMessage = `Invalid "options" type: ${getType(options)}`;
    if (errorMessage) {
      const error = new Error(errorMessage);
      error.name = Process.InstantiationError;
      throw error;
    }

    return input => new Process(options[key] || fallback).start(input);
  }

  /**
   * @type {Promise}
   */
  static noop = Promise.resolve();

  static exit = Promise.resolve(EXIT_CODE);
}

Object.assign(Process, ERRORS);

export default Process;
