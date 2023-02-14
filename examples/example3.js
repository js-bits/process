import Process from '../index.js';

export default (async () => {
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
})();
