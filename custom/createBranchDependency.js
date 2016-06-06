var path = require('path');
var teadsService = require('./TeadsService').getInstance();
var starflow = require('../starflow');
var Task = require('../Task');
var createBranchFactory = require('../git/createBranch');
var BaseExecutable = require('../Executable');

function CreateBranchDependency() {
  BaseExecutable.call(this, 'teads.createBranchDependency');
}
CreateBranchDependency.prototype = Object.create(BaseExecutable.prototype);
CreateBranchDependency.prototype.constructor = CreateBranchDependency;

CreateBranchDependency.prototype.exec = function (dependencyPath, branch) {
  var dependency = teadsService.parseDependency(dependencyPath);
  var fullPath = teadsService.generatePath(dependency);

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

module.exports = function () {
  return function () {
    return new CreateBranchDependency();
  };
};
