'use strict';

var enumerate = require('@js-bits/enumerate');
var executor = require('@js-bits/executor');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var enumerate__default = /*#__PURE__*/_interopDefaultLegacy(enumerate);

const ERRORS = enumerate__default["default"](String)`
  ProcessInstantiationError
`;

class Process extends executor.Executor {
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

const x = new Process(
  args => {
    console.log('step1', args);
  },
  [
    async args => {
      console.log('step1.1', args);
    },
    async args => {
      console.log('step1.2', args);
    },
  ],
  async args => {
    console.log('step2', args);
    return { exit: true };
  },
  async args => {
    console.log('step3', args);
  }
);
x.start({
  a: 2,
}).then(() => {
  console.log('end');
});

console.log(x);

module.exports = Process;
