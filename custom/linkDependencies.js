var _ = require('lodash');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');

function LinkDependencies() {}

LinkDependencies.prototype.exec = function () {

  var dependencies = _.toArray(arguments);
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
    if (dep.chain.length > 1) {
      var tasks = [];
      var path = './', task;
      _.forEach(dep.chain, function (chainedDep) {
        task = new Task(spawnFactory(), [{
          cmd: 'npm',
          args: ['link', chainedDep],
          options: {
            cwd: path
          }
        }]);
        path += 'node_modules/' + chainedDep + '/';
        tasks.push(task);
      });
      return new Sequence(tasks).run();
    } else { // flat dependency
      return new Task(spawnFactory(), ['npm', 'link', dep.name]).run();
    }
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
  return new LinkDependencies();
};
