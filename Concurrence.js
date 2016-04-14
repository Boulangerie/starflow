var _ = require('lodash');
var Promise = require('bluebird');
var Item = require('./Item');

/**
 * var sq = new Concurrence([
 *  new Task(require('./npm/link'), [ 'lodash' ]),
 *  new Task(require('./npm/link'), [ 'bluebird' ]),
 * ]);
 * @constructor
 */
function Concurrence(items) {
  if (_.isEmpty(items)) {
    throw new Error('Parameter "items" is mandatory to construct a new Concurrence');
  }
  this.items = items;
}

Concurrence.prototype = Object.create(Item.prototype);

/**
 * @type {Array<Item>}
 */
Concurrence.prototype.items = null;

Concurrence.prototype.run = function run() {
  var promises = _.map(this.items, function (item) {
    return item.run();
  });
  return Promise.all(promises);
};

module.exports = Concurrence;
