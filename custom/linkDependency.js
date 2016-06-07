var _ = require('lodash');
var path = require('path');
var teadsService = require('./teadsService');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var BaseExecutable = require('../Executable');

function LinkDependency() {
  BaseExecutable.call(this, 'teads.linkDependency');
}
LinkDependency.prototype = Object.create(BaseExecutable.prototype);
LinkDependency.prototype.constructor = LinkDependency;

LinkDependency.prototype.exec = function (dependencyPath) {
  // e.g. dependencyPath = teads-player:release-v1/teads-vpaid-ui
  var dependency = teadsService.parseDependency(dependencyPath);
  // e.g. dependency =
  // {
  //   fullName: 'teads-player:release-v1/teads-vpaid-ui',
  //   name: 'teads-vpaid-ui',
  //   chain: ['teads-player', 'teads-vpaid-ui'],
  //   baseBranch: 'release-v1'
  // }

  var npmLinkTasks = [];
  var pathName = './';
  _.forEach(dependency.chain, function (depName) {
    var resolvedPath = path.resolve(pathName);
    var taskDescription = 'cd ' + resolvedPath.replace(process.env.PWD, '.') + ' && npm link ' + depName;
    var npmLinkExec = this.createExecutable(spawnFactory);
    npmLinkTasks.push(new Task(npmLinkExec, {
      cmd: 'npm',
      args: ['link', depName],
      options: {
        cwd: resolvedPath
      }
    }, null, taskDescription));
    pathName += 'node_modules/' + depName + '/';
  }.bind(this));

  return new Sequence(npmLinkTasks)
    .run()
    .then(function () {
      starflow.logger.log('NPM dependency linked: ' + dependency.name);
    })
    .catch(function (err) {
      starflow.logger.warning('Could not link the dependency');
      throw err;
    });
};

module.exports = function () {
  return new LinkDependency();
};
