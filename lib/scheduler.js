import uniq from 'lodash/array/uniq';

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
    callNext(getObservers(node));
  } finally {
    status = STATUS_IDLE;
  }
};

/**
 * Return node and all its descendants sorted by level.
 *
 * @param {Node} node
 * @returns {Node[]}
 */

const getObservers = node =>
  uniq(collectObservers(node)).sort(compareLevels);

/**
 * Collect observers from provided node recursively.
 *
 * @param {Node} node
 * @returns {Node[]}
 */

const collectObservers = node =>
  node.active
    ? node.observers
      .reduce((observers, observer) =>
        observer.active
          ? [...observers, observer, ...getObservers(observer)]
          : [...observers, ...getObservers(observer)], [node])
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
 * @param {Node[]} nodes
 */

const callNext = ([node, ...nodes]) =>
  node ? node.updateState(() => callNext(nodes)) : undefined;
