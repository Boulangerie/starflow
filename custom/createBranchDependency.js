var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var createBranchFactory = require('../git/createBranch');
var BaseExecutable = require('../Executable');

function CreateBranchDependency(helpers) {
  BaseExecutable.call(this, 'teads.createBranchDependency');
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to CreateBranchDependency constructor');
  }
  this.helpers = helpers;
}
CreateBranchDependency.prototype = Object.create(BaseExecutable.prototype);
CreateBranchDependency.prototype.constructor = CreateBranchDependency;

CreateBranchDependency.prototype.exec = function (dependencyPath, branch) {
  var dependency = this.helpers.parseDependency(dependencyPath);
  var fullPath = this.helpers.generatePath(dependency);

  var gitCreateBranchExec = this.createExecutable(createBranchFactory, [{cwd: fullPath}]);
  return new Task(gitCreateBranchExec, [branch, true], null, 'Create branch ' + branch + ' for ' + dependencyPath)
    .run()
    .then(function () {
      starflow.logger.log('Branch ' + branch + ' created and checked out on ' + dependencyPath + ' dependency');
    })
    .catch(function (err) {
      starflow.logger.warning('Error when creating and checking out ' + branch + ' branch on the ' + dependencyPath + ' dependency');
      throw err;
    });
};

module.exports = function (helpers) {
  return function () {
    return new CreateBranchDependency(helpers);
  };
};
