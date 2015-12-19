var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');

function UnlinkDependencies() {

}

UnlinkDependencies.prototype.exec = function () {

  var dependencies = _.toArray(arguments);
  var dependencyChainSeparator = '/';

  var deps = _.map(dependencies, function (dep) {
    // e.g. dep==="service-format-player", dep==="service-format-player/lib-format-vpaid-ui"
    var depChain = dep.split(dependencyChainSeparator);
    var cdPath = './node_modules/';
    _.forEach(depChain, function (pathDep, index) {
      // e.g. pathDep==="a" then pathDep==="b" for dep==="a/b"
      cdPath += pathDep + ((index === depChain.length - 1) ? '' : '/node_modules/');
    });

    return {
      name: dep,
      chain: depChain,
      path: cdPath
    };
  });

  var promises = _.map(deps, function (dep) {
    return new Sequence([
      new Task(spawnFactory(), ['npm', 'unlink', dep.name]),
      new Task(spawnFactory(), ['npm', 'install', dep.name])
    ]).run();
  });

  return Q.all(promises)
    .then(function () {
      starflow.logger.log('NPM dependencies unlinked: ' + _.pluck(deps, 'name').join(', '));
    })
    .catch(function () {
      starflow.logger.warning('Could not unlink the dependencies');
    });
};

module.exports = function () {
  return new UnlinkDependencies();
};
