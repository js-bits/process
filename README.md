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
  console.log('result', result); // 'result', { step1Result: 'success', step2Result: 'success', step3Result: 'success' }
})();
```

## Exit strategy (Process.exit)

## Process.steps() shortcut

## Process.noop shortcut

## Process.switch() conditional processing

## Notes

- A process is a one time operation. You have to create a new instance each time you need to run the process.
