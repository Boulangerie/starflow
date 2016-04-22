var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var fs = require('fs');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var BaseExecutable = require('../BaseExecutable');

function LinkDependencies(name, parentNamespace, helpers) {
  BaseExecutable.call(this, name, parentNamespace);
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to LinkDependencies constructor');
  }
  this.helpers = helpers;
}
LinkDependencies.prototype = Object.create(BaseExecutable.prototype);
LinkDependencies.prototype.constructor = LinkDependencies;

LinkDependencies.prototype.exec = function () {
  var self = this;
  var dependencies = _.toArray(arguments);
  var deps = this.helpers.parseDependencies(dependencies);

  var alreadyLinked = {}; // e.g. {'./teads-player': true} to avoid doing multiple useless npm links
  var npmLinkItems = [];
  _.forEach(deps, function (dep) {
    var tasks = [];
    var pathName = './';

    _.forEach(dep.chain, function (chainedDep) {
      var resolvedPath = path.resolve(pathName);
      var alreadyKey = resolvedPath + '/' + chainedDep;
      if (!alreadyLinked[alreadyKey]) {
        var description = 'cd ' + resolvedPath.replace(process.env.PWD, '.') + ' && npm link ' + chainedDep;
        var task = new Task(spawnFactory(self.namespace), {
          cmd: 'npm',
          args: ['link', chainedDep],
          options: {
            cwd: resolvedPath
          }
        }, null, description);
        alreadyLinked[alreadyKey] = true;
        tasks.push(task);
      }
      pathName += 'node_modules/' + chainedDep + '/';
    });

    if (tasks.length > 1) {
      npmLinkItems.push(new Sequence(tasks));
    } else {
      npmLinkItems.push(tasks[0]); // push directly the Task instead of creating a Sequence of 1 Task
    }
  });

  return new Sequence(npmLinkItems)
    .run()
    .then(function () {
      starflow.logger.log('NPM dependencies linked: ' + _.pluck(deps, 'name').join(', '));
    })
    .catch(function (err) {
      starflow.logger.warning('Could not link the dependencies');
      throw err;
    });
};

module.exports = function (helpers) {
  return function (parentNamespace) {
    return new LinkDependencies('teads.linkDependencies', parentNamespace, helpers);
  };
};
