# Asynchronous multi-step processing

Allows you to organize a complicated processing logic as a set of simpler consecutive steps. Includes [Executor](https://www.npmjs.com/package/@js-bits/executor) capabilities in case you need some metrics.

## Installation

Install with npm:

```
npm install @js-bits/process
```

Install with yarn:

```
yarn add @js-bits/process
```

Import where you need it:

```javascript
import Process from '@js-bits/process';
```

or require for CommonJS:

```javascript
const Process = require('@js-bits/process');
```

## How to use

Let's say you have a long complicated process that consists of some operations (synchronous or asynchronous) which must be performed sequentially, one by one. `Process` class can help you to simplify the implementation and make it more readable. Here is an example:

```javascript
(async () => {
  // a synchronous function
  const step1 = () => {
    console.log('step1');
  };
  // an asynchronous function
  const step2 = async () => {
    console.log('step2');
  };
  // a promise
  const step3 = new Promise(resolve => {
    setTimeout(() => {
      console.log('step3');
      resolve();
    }, 100);
  });
  // another process
  const step4 = new Process(() => {
    console.log('step4');
  });
  const process = new Process(step1, step2, step3, step4);
  await process.start();
  // step1
  // step2
  // step3
  // step4
})();
```

Alternatively you can combine steps into groups like this:

```javascript
...
const operation1 = [step1, step2];
const operation2 = [step3, step4];
const process = new Process(operation1, operation2);
...
```

The result will be the same as before, but the code looks more structured and logically organized.

## Passing input parameters and returning processing results

You can pass as many input parameters as you need (as an object) into `.start()` method of a `Process` instance.
Steps of the process may return some results (also as an object) if necessary, but not required to do so.
Each step of the process will receive (as an argument) all input parameters as well as results of all preceding steps,
which means that the step logic can be implemented to behave differently depending on what happened before.
The return value of the whole process will be all step results combined.

```javascript
(async () => {
  const step1 = async args => {
    console.log(args); // { inputParam: 1 }
    return { step1Result: 'success' };
  };
  const step2 = async args => {
    console.log(args); // { inputParam: 1, step1Result: 'success' }
    return { step2Result: 'success' };
  };
  const step3 = async args => {
    console.log(args); // { inputParam: 1, step1Result: 'success', step2Result: 'success' }
    return { step3Result: 'success' };
  };
  const process = new Process(step1, step2, step3);
  const result = await process.start({ inputParam: 1 });
  console.log(result); // { step1Result: 'success', step2Result: 'success', step3Result: 'success' }
})();
```

## Process.steps() shortcut

There is `Process.steps()` method available for your convenience.
It's just a shortcut to `new Process(...steps).start(input)`.

```javascript
...
const result = Process.steps(step1, step2, step3)(inputParams)
```

You can also use it for better structuring of your source-code.

```javascript
...
const operation1 = Process.steps(
  step1,
  step2,
  step3,
);
const operation2 = Process.steps(
  step4,
  step5,
  step6,
);
const process = new Process(operation1, operation2);
...
```

## Exit strategy (Process.exit)

Most likely, there will be some exceptional situations when you have to interrupt your processing.
You can account for that using `Process.exit` method.

```javascript
const step1 = async () => {
  console.log('step1');
  return { step1Result: 'success' };
};
const step2 = async () => {
  console.log('step2');
  return Process.exit;
};
const step3 = async () => {
  // this step won't be performed
  console.log('step3');
  return { step3Result: 'success' };
};
const process = new Process(step1, step2, step3);
const result = await process.start({ inputParam: 1 });
console.log(result);
// step1
// step2
// { step1Result: 'success', [Symbol(exit)]: true }
```

If you'd like to also return some additional information related to the process interruption,
just use `Process.exit` as a function (only accepts objects as an argument).

```javascript
...
return Process.exit({ exitReason: 'Something bad has happened'});
...
// { step1Result: 'success', [Symbol(exit)]: true, exitReason: 'Something bad has happened' }
```

## Process.switch() conditional processing

[TBD] `Process.noop` shortcut

## Notes

- A process is a one-off operation. You have to create a new instance each time you need to run the same process.
