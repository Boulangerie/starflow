var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var gitStashFactory = require('../git/stash');

function CheckoutDependencies () {

}

CheckoutDependencies.prototype.exec = function (branch, dependencies) {

  var dependencyChainSeparator = '/';

  var deps = _.map(dependencies, function (dep) {
    // e.g. dep === "teads-player", dep === "teads-player/teads-vpaid-ui"
    var depChain = dep.split(dependencyChainSeparator);
    return {
      name: dep,
      chain: depChain
    };
  });

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
      new Task(gitStashFactory({cwd: fullPath})),
      new Task(spawnFactory(), spawnConfig),
      new Task(gitStashFactory({cwd: fullPath}), true) // git stash pop
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

module.exports = function () {
  return new CheckoutDependencies();
};
