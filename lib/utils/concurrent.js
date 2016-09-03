module.exports = function (starflow) {

  var _ = require('lodash');
  var Workflow = starflow.Workflow;
  var Concurrence = starflow.Concurrency;

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
    starflow.BaseExecutable.call(this, 'utils.concurrent');
  }
  Concurrent.prototype = Object.create(starflow.BaseExecutable.prototype);
  Concurrent.prototype.constructor = Concurrent;

  Concurrent.prototype.exec = function (subSteps) {
    return new Concurrence(_.map(subSteps, function (currentStep) {
      return Workflow.stepToTask(currentStep);
    }));
  };

  return function () {
    return new Concurrent();
  };

};
