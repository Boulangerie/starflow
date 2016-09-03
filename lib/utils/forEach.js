module.exports = function (starflow) {

  var _ = require('lodash');
  var Sequence = starflow.Sequence;

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
    starflow.BaseExecutable.call(this, 'utils.forEach');
  }
  ForEach.prototype = Object.create(starflow.BaseExecutable.prototype);
  ForEach.prototype.constructor = ForEach;

  ForEach.prototype.exec = function (arr, subSteps) {
    if (!this.initiator) {
      throw new Error('Executable ' + this.name + ' needs a workflow as initiator');
    }

    var self = this;
    return new Sequence(_.map(arr, function (value, index) {
      return new Sequence(_.map(subSteps, function (currentStep) {
        var task = self.initiator.stepToTask(currentStep);
        self.addChild(task.instance);
        task.instance.storage.set('index', index);
        task.instance.storage.set('value', value);
        task.instance.storage.set('parentValue', self.storage.get('value'));
        return task;
      }));
    })).run();
  };

  return function () {
    return new ForEach();
  };

};
