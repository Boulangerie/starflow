var Q = require('q');
var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var starflow = require('../starflow');

function CurrentBranch() {

}

CurrentBranch.prototype.currentBranch = function currentBranch() {
  var self = this;
  function onSuccess() {
    var branchName = String(starflow.flow.lastShellOutput).trim();
    starflow.logger.log('Current git branch: ' + branchName);
    _.set(starflow.flow, 'git.currentBranch', branchName);
    return starflow.flow;
  }

  var description = 'git rev-parse --abbrev-ref HEAD';
  return new Task(spawnFactory(), ['git', ['rev-parse', '--abbrev-ref', 'HEAD']], null, description)
    .run()
    .then(onSuccess);
}

CurrentBranch.prototype.exec = function exec() {
  return this.currentBranch();
};

module.exports = function () {
  return new CurrentBranch();
};
