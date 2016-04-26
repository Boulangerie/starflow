var _ = require('lodash');
var Workflow = require('../Workflow');
var Sequence = require('../Sequence');
var BaseExecutable = require('../BaseExecutable');

/**
 *
 * @constructor
 * @example
 * var workflow = [
 *   'npm.getDependencies',
 *   {
 *     'utils.forEach': {
 *        '{{npm.getDependencies.name}}': [
 *         { 'npm.linkDependency': '{{value}}' },
 *         { 'sh': ['cd', '{{value}}'] },
 *         { 'git.checkout': 'master' }
 *       ]
 *     }
 *   }
 * ];
 */
function ForEach(parentNamespace) {
  BaseExecutable.call(this, 'utils.forEach', parentNamespace);
}
ForEach.prototype = Object.create(BaseExecutable.prototype);
ForEach.prototype.constructor = ForEach;

ForEach.prototype.exec = function (arr, subSteps) {
  return new Sequence(_.map(arr, function (value) {
    return new Sequence(_.map(subSteps, function (currentStep) {
      var task = Workflow.stepToTask(currentStep);
      task.instance.storage.set('value', value);
      return task;
    }));
  }));
};

module.exports = function (parentNamespace) {
  return new ForEach(parentNamespace);
};
