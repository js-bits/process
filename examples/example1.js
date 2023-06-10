// @ts-nocheck
import Process from '../index.js';

export default (async () => {
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
