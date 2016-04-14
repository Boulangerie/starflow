var _ = require('lodash');
var Workflow = require('./Workflow');
var Concurrence = require('./Concurrence');

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
  return new Concurrence(_.map(subSteps, function (currentStep) {
    return Workflow.stepToTask(currentStep);
  }));
};

module.exports = function () {
  return new Concurrent();
};
