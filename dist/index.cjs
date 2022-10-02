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

module.exports = Process;
