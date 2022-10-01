'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const steps = (...list) => ({
  start: async args =>
    list.reduce(async (prevStep, operation) => {
      const prevStepResult = await prevStep;
      if (Array.isArray(operation)) {
        return steps(...operation).start(prevStepResult);
      }
      if (typeof operation === 'function') {
        const { exit, ...rest } = prevStepResult || {};
        if (!exit) {
          const result = await operation(rest);
          return { ...rest, ...result };
        }
        return prevStepResult;
      }
      throw new Error('Invalid operation type');
    }, Promise.resolve(args)),
});

console.log('test');

const noop = async () => {};
const exit = async () => ({ exit: false });

exports.exit = exit;
exports.noop = noop;
exports.steps = steps;
