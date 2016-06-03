var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var BaseExecutable = require('../Executable');

function UnlinkDependency(helpers) {
  BaseExecutable.call(this, 'teads.unlinkDependency');
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to UnlinkDependency constructor');
  }
  this.helpers = helpers;
}
UnlinkDependency.prototype = Object.create(BaseExecutable.prototype);
UnlinkDependency.prototype.constructor = UnlinkDependency;

UnlinkDependency.prototype.exec = function (dependencyPath) {
  // e.g. dependencyPath = teads-player:release-v1/teads-vpaid-ui
  var dependency = this.helpers.parseDependency(dependencyPath);

  var pathName = './';
  var resolvedPath = path.resolve(pathName);

  var npmUnlinkExec = this.createExecutable(spawnFactory);
  var npmInstallExec = this.createExecutable(spawnFactory);

  return new Sequence([
    new Task(npmUnlinkExec, [{
      cmd: 'npm',
      args: ['unlink', dependency.name],
      options: {
        cwd: resolvedPath
      }
    }], null, 'cd ' + resolvedPath.replace(process.env.PWD, '.') + ' && npm unlink ' + dependency.name),
    new Task(npmInstallExec, [{
      cmd: 'npm',
      args: ['install', dependency.name],
      options: {
        cwd: resolvedPath
      }
    }], null, 'cd ' + resolvedPath.replace(process.env.PWD, '.') + ' && npm install ' + dependency.name)
  ])
    .run()
    .then(function () {
      starflow.logger.log('NPM dependency unlinked: ' + dependency.name);
    })
    .catch(function (err) {
      starflow.logger.warning('Could not unlink the dependency');
      throw err;
    });
};

module.exports = function (helpers) {
  return function () {
    return new UnlinkDependency(helpers);
  };
};
