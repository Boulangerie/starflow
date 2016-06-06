var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var gitStashFactory = require('../git/stash');
var BaseExecutable = require('../Executable');

function CheckoutDependency(helpers) {
  BaseExecutable.call(this, 'teads.checkoutDependencies');
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to CheckoutDependency constructor');
  }
  this.helpers = helpers;
}
CheckoutDependency.prototype = Object.create(BaseExecutable.prototype);
CheckoutDependency.prototype.constructor = CheckoutDependency;

CheckoutDependency.prototype.exec = function (dependencyPath, branch) {
  var dependency = this.helpers.parseDependency(dependencyPath);
  var fullPath = this.helpers.generatePath(dependency);

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

module.exports = function (helpers) {
  return function () {
    return new CheckoutDependency(helpers);
  };
};
