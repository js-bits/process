# Asynchronous multi-step processing

Allows you to organize a complicated processing logic as a set of simpler subsequent steps. Includes [Executor](https://www.npmjs.com/package/@js-bits/executor) capabilities in case you need some metrics.

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

[TBD]

## Notes

- A process is a one time operation. You have to create a new instance each time you need to run the process.
