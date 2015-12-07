var Q = require('q');
var _ = require('lodash');
var starflow = require('../starflow');
var spawnFactory = require('../shell/spawn');

function Push() {

}

Push.prototype.push = function push(remote, branch) {
  var taskConfig = {args: ['git', ['push', '-u', remote, branch]]};
  return starflow.wrapTask(spawnFactory, taskConfig)();
};

Push.prototype.exec = function exec(remote, branch) {
  remote = remote || 'origin';
  if (!branch) {
    throw new Error('The branch name is required');
  }
  return this.push(remote, branch);
};

module.exports = function () {
  return new Push();
};
