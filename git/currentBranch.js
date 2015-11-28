var Q = require('q');
var _ = require('lodash');
var spawnFactory = require('../shell/spawn');

function CurrentBranch(starflow, muteSteps) {
  this.starflow = starflow;
  this.muteSteps = !!muteSteps;
}

CurrentBranch.prototype.currentBranch = function currentBranch() {
  var starflow = this.starflow;
  var taskConfig = {args: ['git', ['rev-parse', '--abbrev-ref', 'HEAD']]};
  taskConfig.description = taskConfig.args[0] + ' ' + taskConfig.args[1].join(' ');

  var self = this;
  function onSuccess() {
    var branchName = String(starflow.flow.lastShellOutput).trim();
    starflow.logger.log('Current git branch: ' + branchName);
    _.set(starflow.flow, 'git.currentBranch', branchName);
    return starflow.flow;
  }

  return starflow.wrapTask(spawnFactory, taskConfig)()
    .then(onSuccess);
}

CurrentBranch.prototype.exec = function exec() {
  return this.currentBranch();
};

module.exports = function currentBranchFactory(starflow) {
  return new CurrentBranch(starflow);
};
