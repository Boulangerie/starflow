var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');

function UnlinkDependencies(helpers) {
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to UnlinkDependencies constructor');
  }
  this.helpers = helpers;
}

UnlinkDependencies.prototype.exec = function () {

  var dependencies = _.toArray(arguments);
  var dependencyChainSeparator = '/';

  var deps = _.map(dependencies, function (dep) {
    // e.g. dep === "teads-player", dep === "teads-player/teads-vpaid-ui"
    var depChain = dep.split(dependencyChainSeparator);
    return {
      name: dep,
      chain: depChain
    };
  });

  var sequences = _.map(deps, function (dep) {
    if (dep.chain.length > 1) {
      var pathName = _.reduce(dep.chain, function (prev, current, index) {
        prev += (index === dep.chain.length - 1) ? '../' : current + '/node_modules/';
        return prev;
      }, './node_modules/');

      // necessary to resolve paths like "a/node_modules/b/node_modules/../" => "a/node_modules/b"
      pathName = path.resolve(pathName);

      return new Sequence([
        new Task(spawnFactory(), [{
          cmd: 'npm',
          args: ['unlink', dep.name],
          options: {
            cwd: pathName
          }
        }], '$'),
        new Task(spawnFactory(), [{
          cmd: 'npm',
          args: ['install', dep.name],
          options: {
            cwd: pathName
          }
        }], '$')
      ]);
    } else { // flat dependency
      return new Sequence([
        new Task(spawnFactory(), ['npm', 'unlink', dep.name]),
        new Task(spawnFactory(), ['npm', 'install', dep.name])
      ]);
    }
  });

  return new Sequence(sequences)
    .run()
    .then(function () {
      starflow.logger.log('NPM dependencies unlinked: ' + _.pluck(deps, 'name').join(', '));
    })
    .catch(function (err) {
      starflow.logger.warning('Could not unlink the dependencies');
      throw err;
    });
};

module.exports = function (helpers) {
  return function () {
    return new UnlinkDependencies(helpers);
  };
};
