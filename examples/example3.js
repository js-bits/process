import Process from '../index.js';

export default (async () => {
  const step1 = async () => {
    console.log('step1');
    return { step1Result: 'failed' };
  };
  const step2 = async ({ step1Result }) => {
    console.log('step2');
    if (step1Result === 'failed') return Process.exit;
    return { step2Result: 'success' };
  };
  const step3 = async () => {
    console.log('step3');
    return { step3Result: 'success' };
  };
  const process = new Process(step1, step2, step3);
  const result = await process.start({ inputParam: 1 });
  console.log(result);
  // step1
  // step2
  // { step1Result: 'failed', [Symbol(exit)]: true }
})();
