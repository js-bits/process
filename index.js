/* eslint-disable no-use-before-define */
import enumerate from '@js-bits/enumerate';
import { Executor } from '@js-bits/executor';

const { Prefix } = enumerate;

const ERRORS = enumerate(Prefix('Process|'))`
  InitializationError
  ExecutionError
`;

const KEYS = enumerate`
  OPERATION
  SWITCH_KEY
  SWITCH_OPTIONS
  INPUT
  OUTPUT
  EXIT
`;

const getType = value => {
  if (value === null) return 'null';
  if (typeof value === 'object') return String(value);
  return typeof value;
};

const isObject = value => value && typeof value === 'object' && value.constructor === Object;

// fixes issues with aws-xray-sdk wrapping global Promise
const isPromise = value => value instanceof Promise || value instanceof Process.noop.constructor;

const validate = (value, key) => {
  let isValid;
  let errorName = Process.InitializationError;
  // eslint-disable-next-line default-case
  switch (key) {
    case KEYS.OPERATION:
      isValid = value instanceof Process || isPromise(value) || typeof value === 'function';
      break;
    case KEYS.SWITCH_KEY:
      isValid = typeof value === 'string';
      break;
    case KEYS.SWITCH_OPTIONS:
      isValid = isObject(value);
      break;
    case KEYS.INPUT:
    case KEYS.OUTPUT:
      isValid = value === undefined || isObject(value);
      errorName = Process.ExecutionError;
      break;
  }
  if (isValid) return true;

  const error = new Error(`Invalid "${key.description.toLowerCase()}" type: ${getType(value)}`);
  error.name = errorName;
  throw error;
};

const execute = async (operation, input) => {
  let output;
  if (operation instanceof Process) {
    output = await operation.start(input);
  } else if (isPromise(operation)) {
    output = await operation;
  } else if (operation === exit) {
    output = exit(); // exit code
  } else {
    output = await operation(input); // supposed be a function
  }
  if (output === exit) output = exit(); // exit code
  validate(output, KEYS.OUTPUT);
  return output;
};

const mixOutput = (previousOutput, currentOutput) => {
  if (previousOutput && currentOutput) {
    const overlappingProps = Object.keys(previousOutput).filter(key =>
      Object.prototype.hasOwnProperty.call(currentOutput, key)
    );
    if (overlappingProps.length) {
      const error = new Error(`Conflicting step results for: "${overlappingProps.join('", "')}"`);
      error.name = Process.ExecutionError;
      throw error;
    }
  }
  return { ...previousOutput, ...currentOutput };
};

const exit = output => {
  validate(output, KEYS.OUTPUT);
  return { ...output, [KEYS.EXIT]: true };
};

class Process extends Executor {
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return 'Process';
  }

  constructor(...args) {
    // prepare steps
    const steps = args.map(operation => {
      if (Array.isArray(operation)) {
        // wrap into a process
        return new Process(...operation);
      }
      validate(operation, KEYS.OPERATION);
      return operation;
    });

    super(async (resolve, reject, input) => {
      try {
        resolve(
          await steps.reduce(async (previousStep, currentStep) => {
            const previousOutput = await previousStep;
            if (previousOutput && previousOutput[KEYS.EXIT]) return previousOutput;

            const currentInput = { ...input, ...previousOutput };
            const currentOutput = await execute(currentStep, currentInput);

            return mixOutput(previousOutput, currentOutput);
          }, Promise.resolve())
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  execute(input) {
    validate(input, KEYS.INPUT);
    return super.execute(input);
  }

  /**
   * Just an alias of {@link Process#execute} method
   */
  start = this.execute;

  /**
   * Just a shortcut for `new Process(...steps).start(input)`
   * @returns {Function}
   */
  static steps(...list) {
    return input => new Process(...list).start(input);
  }

  static switch(key, options, fallback = Process.noop) {
    validate(key, KEYS.SWITCH_KEY);
    validate(options, KEYS.SWITCH_OPTIONS);
    return input => new Process(options[input[key]] || fallback).start(input);
  }

  /**
   * @type {Promise}
   */
  static noop = Promise.resolve();

  static exit = exit;
}

Object.assign(Process, ERRORS);

export default Process;
