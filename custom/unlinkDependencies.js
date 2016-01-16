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
  var deps = this.helpers.parseDependencies(dependencies);

  var sequences = _.map(deps, function (dep) {
    var pathName = _.reduce(dep.chain, function (prev, current, index) {
      prev += (index === dep.chain.length - 1) ? '../' : current + '/node_modules/';
      return prev;
    }, './node_modules/');

    // necessary to resolve paths like "a/node_modules/b/node_modules/../" => "a/node_modules/b"
    var resolvedPath = path.resolve(pathName);

    return new Sequence([
      new Task(spawnFactory(), [{
        cmd: 'npm',
        args: ['unlink', dep.name],
        options: {
          cwd: resolvedPath
        }
      }], null, 'cd ' + resolvedPath.replace(process.env.PWD, '.') + ' && npm unlink ' + dep.name),
      new Task(spawnFactory(), [{
        cmd: 'npm',
        args: ['install', dep.name],
        options: {
          cwd: resolvedPath
        }
      }], null, 'cd ' + resolvedPath.replace(process.env.PWD, '.') + ' && npm install ' + dep.name)
    ]);
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
