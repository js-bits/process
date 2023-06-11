/* eslint-disable no-console */
// @ts-nocheck
import Process from '../index.js';

export default (async () => {
  const simulateLatency =
    func =>
    (...args) =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(func(...args));
        }, Math.ceil(Math.random() * 500));
      });

  const fetchItem = simulateLatency(() => {
    console.log('item loaded');
    const item = { id: 'item-id', state: 'draft' };
    return { item };
  });
  const checkNeedsUpdate = ({ newState, item }) => {
    if (item.state === newState) return Process.exit;
    console.log('item needs update');
    return undefined;
  };
  const publishItem = simulateLatency(() => {
    console.log('item published');
  });
  const notifySubscribers = simulateLatency(() => {
    console.log('subscribers notified');
  });
  const deleteItem = simulateLatency(() => {
    console.log('item deleted');
  });
  const updateItem = simulateLatency(({ item, newState }) => {
    console.log('item updated');
    return { updateResult: { ...item, state: newState } };
  });

  const processItem = new Process(
    fetchItem,
    checkNeedsUpdate,
    Process.switch('newState', {
      // select next step based on input.newState value
      draft: Process.noop,
      published: [publishItem, notifySubscribers],
      deleted: [deleteItem, Process.exit],
    }),
    updateItem
  );

  const input = { id: 'item-id', newState: 'published' };
  const result = await processItem.start(input);
  console.log(result.updateResult);
  // item loaded
  // item needs update
  // item published
  // subscribers notified
  // item updated
  // { id: 'item-id', state: 'published' }
})();
