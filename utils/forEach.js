var _ = require('lodash');
var Workflow = require('./Workflow');
var Sequence = require('./Sequence');

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

}

ForEach.prototype.exec = function (arr, subSteps) {
  return new Sequence(_.map(subSteps, function (currentStep) {
    return Workflow.stepToTask(currentStep);
  }));
};

module.exports = function () {
  return new ForEach();
};
