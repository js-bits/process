'use strict';

var enumerate = require('@js-bits/enumerate');
var executor = require('@js-bits/executor');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var enumerate__default = /*#__PURE__*/_interopDefaultLegacy(enumerate);

const { Prefix } = enumerate__default["default"];

const ERRORS = enumerate__default["default"](Prefix('Process|'))`
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

class Process extends executor.Executor {
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
            } else if (operation instanceof Promise) {
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

  execute(args) {
    if (args !== undefined && !isObject(args)) {
      const error = new Error(`Invalid input type: ${getType(args)}`);
      error.name = Process.ExecutionError;
      throw error;
    }
    return super.execute(args);
  }

  /**
   * Just an alias of {@link Process#execute} method
   */
  start = this.execute;

  /**
   * Shortcut
   */
  static steps(...list) {
    return args => new Process(...list).start(args);
  }

  static switch(key, options, defaultOption = Process.noop) {
    let errorMessage;
    if (typeof key !== 'string') errorMessage = `Invalid "key" type: ${getType(key)}`;
    else if (!isObject(options)) errorMessage = `Invalid "options" type: ${getType(options)}`;
    if (errorMessage) {
      const error = new Error(errorMessage);
      error.name = Process.InstantiationError;
      throw error;
    }

    return args => new Process(options[key] || defaultOption).start(args);
  }

  static noop = Promise.resolve();

  static exit = Promise.resolve(EXIT_CODE);
}

Object.assign(Process, ERRORS);

module.exports = Process;
