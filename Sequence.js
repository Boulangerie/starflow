var _ = require('lodash');
var Promise = require("bluebird");
var Item = require('./Item');

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

Sequence.prototype = Object.create(Item.prototype);

/**
 * @type {Array<Item>}
 */
Sequence.prototype.items = null;

Sequence.prototype.run = function run() {
  return _.reduce(this.items, function (prev, current) {
    return prev.then(function () {
      return current.run();
    });
  }, Promise.resolve());
};

module.exports = Sequence;
