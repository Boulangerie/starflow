var path = require('path');
var teadsService = require('./TeadsService').getInstance();
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var gitStashFactory = require('../git/stash');
var BaseExecutable = require('../Executable');

function CheckoutDependency() {
  BaseExecutable.call(this, 'teads.checkoutDependencies');
}
CheckoutDependency.prototype = Object.create(BaseExecutable.prototype);
CheckoutDependency.prototype.constructor = CheckoutDependency;

CheckoutDependency.prototype.exec = function (dependencyPath, branch) {
  var dependency = teadsService.parseDependency(dependencyPath);
  var fullPath = teadsService.generatePath(dependency);

  var stashExec = this.createExecutable(gitStashFactory, [{cwd: fullPath}]);
  var spawnExec = this.createExecutable(spawnFactory);
  var spawnConfig = {
    cmd: 'git',
    args: ['checkout', branch],
    options: {
      cwd: fullPath
    }
  };
  var unstashExec = this.createExecutable(gitStashFactory, [{cwd: fullPath}]);

  return new Sequence([
    new Task(stashExec),
    new Task(spawnExec, spawnConfig, null, 'cd ' + fullPath.replace(process.env.PWD, '.') + ' && git checkout ' + branch),
    new Task(unstashExec, true) // git stash pop
  ])
    .run()
    .then(function () {
      starflow.logger.log('The branch ' + branch + ' has been checked out for the ' + dependencyPath + ' dependency');
    })
    .catch(function (err) {
      starflow.logger.warning('Could not checkout ' + branch + ' branch on the ' + dependencyPath + ' dependency');
      throw err;
    });
};

module.exports = function () {
  return function () {
    return new CheckoutDependency();
  };
};
