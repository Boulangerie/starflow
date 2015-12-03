var _ = require('lodash');
var Q = require('q');
var spawnFactory = require('../shell/spawn');

function Stash(starflow) {
  this.starflow = starflow;
}

Stash.prototype.stash = function stash(isPop) {
  var starflow = this.starflow;

  function onError(err) {
    if (!/No stash found/.test(err.message)) {
      throw err;
    }
    return starflow.flow;
  }

  var gitArgs = ['stash'];
  if (isPop) {
    gitArgs.push('pop');
  }
  var taskConfig = {args: ['git', gitArgs]};
  return starflow.wrapTask(spawnFactory, taskConfig)()
    .catch(onError);
};

Stash.prototype.exec = function exec(isPop) {
  return this.stash(!!isPop);
};

module.exports = Stash;
