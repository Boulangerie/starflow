var _ = require('lodash');
var Promise = require('bluebird');
var Workflow = require('./Workflow');

/**
 *
 * @constructor
 * @example
 * var workflow = [
 *   { 'git.checkout': branch },
 *   { 'utils.concurrent': [
 *       { 'teads.linkDependency': 'teads-lib-front-accounts' },
 *       { 'teads.linkDependency': 'teads-lib-front-models' }
 *   ]}
 * ];
 */
function Concurrent() {

}

Concurrent.prototype.exec = function (subSteps) {
  var promises = _.map(subSteps, function (step) {
    var workflow = new Workflow(step);
    return workflow.run();
  });
  return Promise.all(promises);
};

module.exports = function () {
  return new Concurrent();
};
