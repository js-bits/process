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
const operation1 = [step1, step2];
const operation2 = [step3, step4];
const process = new Process(operation1, operation2);
```

The result will be the same as before, but the code looks more structured and logically organized.

## Passing input parameters and returning processing results

[TBD]

## Notes

- A process is a one time operation. You have to create a new instance each time you need to run the process.
