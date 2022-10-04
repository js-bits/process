'use strict';

var enumerate = require('@js-bits/enumerate');
var executor = require('@js-bits/executor');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var enumerate__default = /*#__PURE__*/_interopDefaultLegacy(enumerate);

const { Prefix } = enumerate__default["default"];

const ERRORS = enumerate__default["default"](Prefix('Process|'))`
  InstantiationError
`;

const EXIT_CODE = { exit: true };

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
      const error = new Error(`Invalid operation type: ${operation === null ? 'null' : typeof operation}`);
      error.name = Process.InstantiationError;
      throw error;
    });

    super(async (resolve, reject, args) => {
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
            } else if (typeof operation === 'function') {
              result = await operation(prevResult);
            }
            return { ...result, ...prevResult };
          }, Promise.resolve(args))
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Just an alias of {@link Executor#execute} method
   */
  start = super.execute;

  static steps(...list) {
    return args => new Process(...list).start(args);
  }

  static switch(key, options, defaultOption = Process.noop) {
    return args => new Process(options[key]).start(args);
  }

  static noop = Promise.resolve();

  static exit = Promise.resolve(EXIT_CODE);
}

Object.assign(Process, ERRORS);

module.exports = Process;
