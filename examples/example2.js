import Process from '../index.js';

export default (async () => {
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
