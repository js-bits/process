'use strict';

var enumerate = require('@js-bits/enumerate');
var executor = require('@js-bits/executor');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var enumerate__default = /*#__PURE__*/_interopDefaultLegacy(enumerate);

const { Prefix } = enumerate__default["default"];

const ERRORS = enumerate__default["default"](Prefix('Process|'))`
  InstantiationError
`;

class Process extends executor.Executor {
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Process';
  }

  constructor(...steps) {
    super(async (resolve, reject, args) => {
      const processResult = await steps.reduce(async (prevStep, operation) => {
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
        error.name = Process.InstantiationError;
        throw error;
      }, Promise.resolve(args));
      const { exit, ...rest } = processResult;
      resolve(rest);
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

module.exports = Process;
