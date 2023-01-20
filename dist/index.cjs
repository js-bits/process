'use strict';

var enumerate = require('@js-bits/enumerate');
var executor = require('@js-bits/executor');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var enumerate__default = /*#__PURE__*/_interopDefaultLegacy(enumerate);

/* eslint-disable no-use-before-define */

const { Prefix } = enumerate__default["default"];

const ERRORS = enumerate__default["default"](Prefix('Process|'))`
  InitializationError
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

const check = (value, name) => {
  let isValid;
  let errorName = Process.InitializationError;
  // eslint-disable-next-line default-case
  switch (name) {
    case 'operation':
      isValid = value instanceof Process || isPromise(value) || typeof value === 'function';
      break;
    case 'switch:key':
      isValid = typeof value === 'string';
      break;
    case 'switch:options':
      isValid = isObject(value);
      break;
    case 'input':
    case 'output':
      isValid = value === undefined || isObject(value);
      errorName = Process.ExecutionError;
      break;
  }
  if (isValid) return true;

  const error = new Error(`Invalid "${name}" type: ${getType(value)}`);
  error.name = errorName;
  throw error;
};

class Process extends executor.Executor {
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Process';
  }

  constructor(...args) {
    // wrap into processes
    const steps = args.map(operation => {
      if (Array.isArray(operation)) {
        return new Process(...operation);
      }
      check(operation, 'operation');
      return operation;
    });

    super(async (resolve, reject, input) => {
      try {
        resolve(
          await steps.reduce(async (prevStep, operation) => {
            const prevResult = await prevStep;
            if (prevResult && prevResult.exit) return prevResult;

            let result;
            const stepInput = { ...input, ...prevResult };
            if (operation instanceof Process) {
              result = await operation.start(stepInput);
            } else if (isPromise(operation)) {
              result = await operation;
            } else {
              // should be a function
              result = await operation(stepInput);
            }

            check(result, 'output');
            return { ...result, ...prevResult };
          }, Promise.resolve())
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // super(async (resolve, reject, input) => {
  //   try {
  //     resolve(
  //       await steps.reduce(async (prevStep, operation) => {
  //         const prevOut = await prevStep;
  //         if (prevOut && prevOut.exit) return prevOut;

  //         const newOut = await this.runStep(operation, { ...input, ...prevOut });
  //         let output;
  //         if (operation instanceof Process) {
  //           output = await operation.start(input);
  //         } else if (isPromise(operation)) {
  //           output = await operation;
  //         } else {
  //           output = await operation(input); // supposed be a function
  //         }
  //         check(output, 'output');
  //       }, Promise.resolve())
  //     );
  //   } catch (error) {
  //     reject(error);
  //   }
  // });

  // if (prevOut || newOut) {
  //   const overlappingProps = Object.keys(prevOut || []).filter(
  //     key => newOut && Object.prototype.hasOwnProperty.call(newOut, key)
  //   );
  //   if (overlappingProps.length) {
  //     const error = new Error(`Conflicting step results for: ${overlappingProps.join(', ')}`);
  //     error.name = Process.ExecutionError;
  //     throw error;
  //   }
  //   return { ...prevOut, ...newOut };
  // }
  // return undefined;

  // // eslint-disable-next-line class-methods-use-this
  // async runStep(operation, input) {
  //   let output;
  //   if (operation instanceof Process) {
  //     output = await operation.start(input);
  //   } else if (isPromise(operation)) {
  //     output = await operation;
  //   } else {
  //     output = await operation(input); // supposed be a function
  //   }
  //   check(output, 'output');
  //   return output;
  // }

  // eslint-disable-next-line class-methods-use-this

  execute(input) {
    check(input, 'input');
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
    check(key, 'switch:key');
    check(options, 'switch:options');
    return input => new Process(options[key] || fallback).start(input);
  }

  /**
   * @type {Promise}
   */
  static noop = Promise.resolve();

  static exit = Promise.resolve(EXIT_CODE);
}

Object.assign(Process, ERRORS);
Object.freeze(Process);

module.exports = Process;
