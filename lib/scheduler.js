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
 * Schedule and run provided node.
 *
 * @param {Node} node
 * @throws
 */

export const scheduleAndRun = node => {
  if (status === STATUS_RUNNING)
    throw new Error('Scheduler is running, avoid cascading updates');

  status = STATUS_RUNNING;
  try {
    callNext(getDescendants(node));
  } finally {
    status = STATUS_IDLE;
  }
};

/**
 * Return given node and its descendants sorted by level.
 *
 * @param {Node} node
 * @returns {Node[]}
 */

const getDescendants = node =>
  uniq(collectDescendants(node)).sort(compareLevels);

/**
 * Recursively collect descendants of provided node.
 *
 * @param {Node} node
 * @returns {Node[]}
 */

const collectDescendants = node =>
  node.active
    ? node.children
      .reduce((descendants, child) =>
        child.active
          ? [...descendants, child, ...getDescendants(child)]
          : [...descendants, ...getDescendants(child)], [node])
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
