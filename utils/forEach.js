var _ = require('lodash');
var Sequence = require('../Sequence');
var BaseExecutable = require('../Executable');

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
function ForEach() {
  BaseExecutable.call(this, 'utils.forEach');
}
ForEach.prototype = Object.create(BaseExecutable.prototype);
ForEach.prototype.constructor = ForEach;

ForEach.prototype.exec = function (arr, subSteps) {
  if (!this.initiator) {
    throw new Error('Executable ' + this.name + ' needs a workflow as initiator');
  }

  var self = this;
  return new Sequence(_.map(arr, function (value) {
    return new Sequence(_.map(subSteps, function (currentStep) {
      var task = self.initiator.stepToTask(currentStep);
      self.addChild(task.instance);
      task.instance.storage.set('value', value);
      task.instance.storage.set('parentValue', self.storage.get('value'));
      return task;
    }));
  })).run();
};

module.exports = function () {
  return new ForEach();
};
