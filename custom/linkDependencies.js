var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');

function LinkDependencies(helpers) {
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to LinkDependencies constructor');
  }
  this.helpers = helpers;
}

LinkDependencies.prototype.exec = function () {

  var dependencies = _.toArray(arguments);
  var deps = this.helpers.parseDependencies(dependencies);

  var promises = _.map(deps, function (dep) {
    var tasks = [];
    var pathName = './';
    var task;
    _.forEach(dep.chain, function (chainedDep) {
      task = new Task(spawnFactory(), [{
        cmd: 'npm',
        args: ['link', chainedDep],
        options: {
          cwd: path.resolve(pathName)
        }
      }]);
      pathName += 'node_modules/' + chainedDep + '/';
      tasks.push(task);
    });
    return new Sequence(tasks).run();
  });

  return Promise.all(promises)
    .then(function () {
      starflow.logger.log('NPM dependencies linked: ' + _.pluck(deps, 'name').join(', '));
    })
    .catch(function (err) {
      starflow.logger.warning('Could not link the dependencies');
      throw err;
    });
};

module.exports = function (helpers) {
  return function() {
    return new LinkDependencies(helpers);
  };
};
