var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var starflow = require('../starflow');

function CurrentBranch() {

}

CurrentBranch.prototype.currentBranch = function currentBranch() {
  function onSuccess() {
    var branchName = String(starflow.config.lastShellOutput).trim();
    starflow.logger.log('Current git branch: ' + branchName);
    _.set(starflow.config, 'git.currentBranch', branchName);
  }

  var description = 'git rev-parse --abbrev-ref HEAD';
  return new Task(spawnFactory(), ['git', ['rev-parse', '--abbrev-ref', 'HEAD']], null, description)
    .run()
    .then(onSuccess);
};

CurrentBranch.prototype.exec = function exec() {
  return this.currentBranch();
};

module.exports = function () {
  return new CurrentBranch();
};
