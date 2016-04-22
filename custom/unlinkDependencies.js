var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var BaseExecutable = require('../BaseExecutable');

function UnlinkDependencies(name, parentNamespace, helpers) {
  BaseExecutable.call(this, name, parentNamespace);
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to UnlinkDependencies constructor');
  }
  this.helpers = helpers;
}
UnlinkDependencies.prototype = Object.create(BaseExecutable.prototype);
UnlinkDependencies.prototype.constructor = UnlinkDependencies;

UnlinkDependencies.prototype.exec = function () {
  var dependencies = _.toArray(arguments);
  var deps = this.helpers.parseDependencies(dependencies);

  var sequences = _.map(deps, function (dep) {
    var pathName = _.reduce(dep.chain, function (prev, current, index) {
      prev += (index === dep.chain.length - 1) ? '../' : (current + '/node_modules/');
      return prev;
    }, './node_modules/');

    // necessary to resolve paths like "a/node_modules/b/node_modules/../" => "a/node_modules/b"
    var resolvedPath = path.resolve(pathName);

    return new Sequence([
      new Task(spawnFactory(this.namespace), [{
        cmd: 'npm',
        args: ['unlink', dep.name],
        options: {
          cwd: resolvedPath
        }
      }], null, 'cd ' + resolvedPath.replace(process.env.PWD, '.') + ' && npm unlink ' + dep.name),
      new Task(spawnFactory(this.namespace), [{
        cmd: 'npm',
        args: ['install', dep.name],
        options: {
          cwd: resolvedPath
        }
      }], null, 'cd ' + resolvedPath.replace(process.env.PWD, '.') + ' && npm install ' + dep.name)
    ]);
  }.bind(this));

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
  return function (parentNamespace) {
    return new UnlinkDependencies('teads.unlinkDependencies', parentNamespace, helpers);
  };
};
