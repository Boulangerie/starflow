var _ = require('lodash');
var Workflow = require('../Workflow');
var Concurrence = require('../Concurrency');
var BaseExecutable = require('../Executable');

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
  BaseExecutable.call(this, 'utils.concurrent');
}
Concurrent.prototype = Object.create(BaseExecutable.prototype);
Concurrent.prototype.constructor = Concurrent;

Concurrent.prototype.exec = function (subSteps) {
  return new Concurrence(_.map(subSteps, function (currentStep) {
    return Workflow.stepToTask(currentStep);
  }));
};

module.exports = function () {
  return new Concurrent();
};
