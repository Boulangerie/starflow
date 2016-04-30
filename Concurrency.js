var _ = require('lodash');
var Promise = require('bluebird');
var Item = require('./Item');

/**
 * var sq = new Concurrency([
 *  new Task(require('./npm/link'), [ 'lodash' ]),
 *  new Task(require('./npm/link'), [ 'bluebird' ]),
 * ]);
 * @constructor
 */
function Concurrency(items) {
  if (_.isEmpty(items)) {
    throw new Error('Parameter "items" is mandatory to construct a new Concurrency');
  }
  this.items = items;
}

Concurrency.prototype = Object.create(Item.prototype);

/**
 * @type {Array<Item>}
 */
Concurrency.prototype.items = null;

Concurrency.prototype.run = function run() {
  var promises = _.map(this.items, function (item) {
    return item.run();
  });
  return Promise.all(promises);
};

module.exports = Concurrency;
