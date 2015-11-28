var Q = require('q');
var _ = require('lodash');
var spawnFactory = require('../shell/spawn');

function Fetch(starflow) {
  this.starflow = starflow;
}

Fetch.prototype.fetch = function fetch(remote, branch) {
  var starflow = this.starflow;

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

module.exports = function FetchFactory(starflow) {
  return new Fetch(starflow);
};
