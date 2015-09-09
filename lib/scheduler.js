/**
 * Scheduler transaction ID.
 * Incremented during each scheduler transaction.
 *
 * @type {Number}
 */

let transactionId = 0;

/**
 * Scheduler IDLE status.
 *
 * @type {Symbol}
 */

const STATUS_IDLE = Symbol();

/**
 * Scheduler running status.
 *
 * @type {Symbol}
 */

const STATUS_RUNNING = Symbol();

/**
 * Scheduler status.
 * Scheduler can be run only if status is IDLE.
 *
 * @type {Symbol}
 */

let status = STATUS_IDLE;

/**
 * Schedule and run a scheduler transaction on give node.
 *
 * @param {Node} node
 * @throws
 */

export const scheduleAndRun = node => {
  if (status === STATUS_RUNNING)
    throw new Error('Scheduler is running, avoid cascading updates');

  status = STATUS_RUNNING;
  try {
    callNext(++transactionId, getObservers(node));
  } finally {
    status = STATUS_IDLE;
  }
};

/**
 * Collect and order node observers.
 *
 * @param {Node} node
 * @returns {Node[]}
 */

const getObservers = node =>
  node.active
    ? node.observers
      .reduce((observers, observer) =>
        observer.active
          ? [...observers, observer, ...getObservers(observer)]
          : [...observers, ...getObservers(observer)], [])
      .concat([node])
      .sort(compareLevels)
    : [];

/**
 * Node levels comparator.
 * Smaller level is smaller node.
 *
 * @param {Node} nodeX
 * @param {Node} nodeY
 * @returns {Number}
 */

const compareLevels = (nodeX, nodeY) =>
  nodeX.level < nodeY.level
    ? -1 : (nodeX.level > nodeY.level ? 1 : 0);

/**
 * CallNext node of scheduled nodes.
 *
 * @param {Number} transactionId
 * @param {Node[]} nodes
 */

const callNext = (transactionId, [node, ...nodes]) => {
  if (!node)
    return;

  return transactionId <= node.lastTransactionId
    ? callNext(transactionId, nodes)
    : node.updateState(transactionId, () => callNext(transactionId, nodes));
};
