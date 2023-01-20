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

// fixes issues with aws-xray-sdk wrapping global Promise
const isPromise = value => value instanceof Promise || value instanceof Process.noop.constructor;

class Process extends executor.Executor {
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

    super(async (resolve, reject, input) => {
      try {
        resolve(
          await steps.reduce(async (prevStep, operation) => {
            const prevOut = await prevStep;
            if (prevOut && prevOut.exit) return prevOut;

            const newOut = await this.runStep(operation, { ...input, ...prevOut });

            if (prevOut || newOut) {
              const overlappingProps = Object.keys(prevOut || []).filter(
                key => newOut && Object.prototype.hasOwnProperty.call(newOut, key)
              );
              if (overlappingProps.length) {
                const error = new Error(`Conflicting step results for: ${overlappingProps.join(', ')}`);
                error.name = Process.ExecutionError;
                throw error;
              }
              return { ...prevOut, ...newOut };
            }
            return undefined;
          }, Promise.resolve())
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async runStep(operation, input) {
    let output;
    if (operation instanceof Process) {
      output = await operation.start(input);
    } else if (isPromise(operation)) {
      output = await operation;
    } else {
      // should be a function
      output = await operation(input);
    }

    if (output === undefined || isObject(output)) {
      return output;
    }

    const error = new Error(`Invalid output type: ${getType(output)}`);
    error.name = Process.ExecutionError;
    throw error;
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
Object.freeze(Process);

module.exports = Process;
