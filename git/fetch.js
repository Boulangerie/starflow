var Q = require('q');
var _ = require('lodash');
var starflow = require('../starflow');
var spawnFactory = require('../shell/spawn');

function Fetch() {

}

Fetch.prototype.fetch = function fetch(remote, branch) {
  var gitArgs = ['fetch', remote];
  // if no specific branch, then fetch every branch on specified remote
  if (branch) {
    gitArgs.push(branch);
  }
  var taskConfig = {args: ['git', gitArgs]};
  return starflow.wrapTask(spawnFactory, taskConfig)();
};

Fetch.prototype.exec = function exec(remote, branch) {
  remote = remote || 'origin';
  return this.fetch(remote, branch);
};

module.exports = function () {
  return new Fetch();
};
