var _ = require('lodash');
var Workflow = require('../Workflow');
var Concurrence = require('../Concurrence');
var BaseExecutable = require('../BaseExecutable');

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
function Concurrent(parentNamespace) {
  BaseExecutable.call(this, 'utils.concurrent', parentNamespace);
}
Concurrent.prototype = Object.create(BaseExecutable.prototype);
Concurrent.prototype.constructor = Concurrent;

Concurrent.prototype.exec = function (subSteps) {
  return new Concurrence(_.map(subSteps, function (currentStep) {
    return Workflow.stepToTask(currentStep);
  }));
};

module.exports = function (parentNamespace) {
  return new Concurrent(parentNamespace);
};
