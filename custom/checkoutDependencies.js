var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var gitStashFactory = require('../git/stash');
var BaseExecutable = require('../BaseExecutable');

function CheckoutDependencies(parentNamespace, helpers) {
  BaseExecutable.call(this, 'teads.checkoutDependencies', parentNamespace);
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

    return new Sequence([
      new Task(gitStashFactory(this.namespace, {cwd: fullPath})),
      new Task(spawnFactory(this.namespace), spawnConfig, null, 'cd ' + pathName + ' && git checkout ' + branch),
      new Task(gitStashFactory(this.namespace, {cwd: fullPath}), true) // git stash pop
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
  return function (parentNamespace) {
    return new CheckoutDependencies(parentNamespace, helpers);
  };
};
