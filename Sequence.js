var _ = require('lodash');
var Q = require('q');
var starflow = require('./starflow');

/**
 * var sq = new Sequence([
 *  new Task(require('./git/checkout'), [ 'master' ]),
 *  new Sequence([
 *    new Task(require('./npm/link'), [ 'lodash' ]),
 *    new Task(require('./shell/spawn'), [ 'cd', [ 'node_modules/lodash' ] ])
 *  ])
 * ]);
 * @constructor
 */
function Sequence(items) {
  if (_.isEmpty(items)) {
    throw new Error('Parameter "items" is mandatory to construct a new Sequence');
  }
  this.items = items;
}

/**
 * @type {Array<Task|Sequence>}
 */
Sequence.prototype.items = null;

Sequence.prototype.run = function run() {
  return _.reduce(this.items, function (prev, current) {
    return prev.then(function () {
      return current.run();
    });
  }, Q());
};

module.exports = Sequence;
