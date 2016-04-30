var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var gitStashFactory = require('../git/stash');
var BaseExecutable = require('../Executable');

function CheckoutDependencies(helpers) {
  BaseExecutable.call(this, 'teads.checkoutDependencies');
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to CheckoutDependencies constructor');
  }
  this.helpers = helpers;
}
CheckoutDependencies.prototype = Object.create(BaseExecutable.prototype);
CheckoutDependencies.prototype.constructor = CheckoutDependencies;

CheckoutDependencies.prototype.exec = function (branch, dependencies) {

  var deps = this.helpers.parseDependencies(dependencies);

  var promises = _.map(deps, function (dep) {
    var pathName = _.reduce(dep.chain, function (prev, current) {
      return prev + 'node_modules/' + current + '/';
    }, './');
    var fullPath = path.resolve(pathName);
    var spawnConfig = {
      cmd: 'git',
      args: ['checkout', branch],
      options: {
        cwd: fullPath
      }
    };

    var stashExec = gitStashFactory({cwd: fullPath});
    this.addChild(stashExec);

    var spawnExec = spawnFactory();
    this.addChild(spawnExec);

    var unstashExec = gitStashFactory({cwd: fullPath});
    this.addChild(unstashExec);

    return new Sequence([
      new Task(stashExec),
      new Task(spawnExec, spawnConfig, null, 'cd ' + pathName + ' && git checkout ' + branch),
      new Task(unstashExec, true) // git stash pop
    ]);
  });

  return new Sequence(promises)
    .run()
    .then(function () {
      starflow.logger.log('The branch "' + branch + '" has been checked out for the following dependencies: ' + _.pluck(deps, 'name').join(', '));
    })
    .catch(function (err) {
      starflow.logger.warning('Could not checkout "' + branch + '" on the given dependencies');
      throw err;
    });
};

module.exports = function (helpers) {
  return function () {
    return new CheckoutDependencies(helpers);
  };
};
