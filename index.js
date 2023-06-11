/* eslint-disable no-use-before-define */
import enumerate from '@js-bits/enumerate';
import { Executor } from '@js-bits/executor';

const KEYS = enumerate.ts(`
  OPERATION
  SWITCH_KEY
  SWITCH_OPTIONS
  INPUT
  OUTPUT
  EXIT
`);

/**
 * @param {any} value
 * @returns {string}
 */
const getType = value => {
  if (value === null) return 'null';
  if (typeof value === 'object') return String(value);
  return typeof value;
};

/**
 * @param {any} value
 * @returns {boolean}
 */
const isObject = value => !!(value && typeof value === 'object' && value.constructor === Object);

/**
 * Fixes issues with aws-xray-sdk wrapping global Promise
 * @param {any} value
 * @returns {boolean}
 */
const isPromise = value => value instanceof Promise || value instanceof Process.noop.constructor;

/**
 * @param {any} value
 * @param {typeof KEYS[Exclude<keyof KEYS, symbol>]} key
 * @returns
 */
const validate = (value, key) => {
  /** @type {boolean} */
  let isValid = false;
  /** @type {typeof ERRORS[Exclude<keyof ERRORS, symbol>]} */
  let errorName = ERRORS.InitializationError;
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
      errorName = ERRORS.ExecutionError;
      break;
  }
  if (isValid) return true;

  const error = new Error(`Invalid "${key.description?.toLowerCase()}" type: ${getType(value)}`);
  error.name = errorName;
  throw error;
};

/**
 * Plain object (excluding promises)
 * @typedef {{ [key: string]: any } & { then?: void }} Input
 */

/**
 * Plain object (excluding promises)
 * @typedef {{ [key: string]: any } & { then?: void }} Output
 */

/** @typedef {Output | Process.exit | void | undefined} OperationResult */

/**
 * @typedef {(input?: Input) => OperationResult | Promise<OperationResult>} FunctionStep
 */

/**
 * @typedef {Process<OperationResult> | Promise<OperationResult> | FunctionStep} Operation
 */

/**
 * @param {Operation} operation
 * @param {Input} [input]
 * @returns {Promise<Output>}
 */
const execute = async (operation, input) => {
  let output;
  if (operation instanceof Process) {
    output = await operation.start(input);
  } else if (isPromise(operation)) {
    output = await operation;
  } else if (operation === exit) {
    output = exit(); // exit code
  } else {
    output = await /** @type {FunctionStep} */ (operation)(input); // supposed be a function
  }
  if (output === exit) output = exit(); // exit code
  validate(output, KEYS.OUTPUT);
  return output;
};

/**
 * @param {object} previousOutput
 * @param {object} currentOutput
 * @returns
 */
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

/**
 * @param {Output} [output]
 * @returns {Output & { [KEYS.EXIT]: true }}
 */
const exit = output => {
  validate(output, KEYS.OUTPUT);
  return { ...output, [KEYS.EXIT]: true };
};

/**
 * @template T
 * @extends {Executor<T>}
 */
class Process extends Executor {
  // eslint-disable-next-line class-methods-use-this
  get [Symbol.toStringTag]() {
    return Process.name;
  }

  /**
   * @param  {(Operation | Operation[])[]} args
   */
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

    super(async (resolve, reject, /** @type {Input} */ input) => {
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

  /**
   * @param {Input} [input]
   * @returns {this}
   */
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
   * @param {Operation[]} list
   * @returns {FunctionStep}
   */
  static steps(...list) {
    return /** @type {FunctionStep} */ input => new Process(...list).start(input);
  }

  /**
   * @param {string} key
   * @param {{ [key: string]: Operation | Operation[]}} options
   * @param {Operation} fallback
   * @returns
   */
  static switch(key, options, fallback = Process.noop) {
    validate(key, KEYS.SWITCH_KEY);
    validate(options, KEYS.SWITCH_OPTIONS);
    return /** @type {FunctionStep} */ input =>
      new Process((input && options[/** @type {string} */ (input[key])]) || fallback).start(input);
  }

  /**
   * @type {Promise<void>}
   */
  static noop = Promise.resolve();

  static exit = exit;
}

const ERRORS = enumerate.ts(
  `
  InitializationError
  ExecutionError
`,
  `${Process.name}|`
);

// Assigning properties like this helps typescript to declare the namespace properly
Process.ExecutionError = ERRORS.ExecutionError;
Process.InitializationError = ERRORS.InitializationError;

export default Process;
