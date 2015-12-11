var Q = require('q');
var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');

function Fetch() {

}

Fetch.prototype.fetch = function fetch(remote, branch) {
  var gitArgs = ['fetch', remote];
  // if no specific branch, then fetch every branch on specified remote
  if (branch) {
    gitArgs.push(branch);
  }
  return new Task(spawnFactory(), ['git', gitArgs])
    .run();
};

Fetch.prototype.exec = function exec(remote, branch) {
  remote = remote || 'origin';
  return this.fetch(remote, branch);
};

module.exports = function () {
  return new Fetch();
};
