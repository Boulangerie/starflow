var _ = require('lodash');
var Q = require('q');
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
    // e.g. dep==="teads-player", dep==="teads-player/lib-format-vpaid-ui"
    var depChain = dep.split(dependencyChainSeparator);
    return {
      name: dep,
      chain: depChain
    };
  });

  var promises = _.map(deps, function (dep) {
    var tasks = [];
    var task;
    var path = './';
    _.forEach(dep.chain, function (chainedDep) {
      path += 'node_modules/' + chainedDep + '/';
      task = new Sequence([
        new Task(gitStashFactory()),
        new Task(spawnFactory(), [{
          cmd: 'git',
          args: ['checkout', branch],
          options: {
            cwd: path
          }
        }]),
        new Task(gitStashFactory(), [true])
      ]);
      tasks.push(task);
    });
    return new Sequence(tasks).run();
  });

  return Q.all(promises)
    .then(function () {
      starflow.logger.log('NPM dependencies linked: ' + _.pluck(deps, 'name').join(', '));
    })
    .catch(function (err) {
      starflow.logger.warning('Could not link the dependencies');
      throw err;
    });
};

module.exports = function () {
  return new CheckoutDependencies();
};
