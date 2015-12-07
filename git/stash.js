var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');
var spawnFactory = require('../shell/spawn');

function Stash() {

}

Stash.prototype.stash = function stash(isPop) {
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

module.exports = function () {
  return new Stash();
};
