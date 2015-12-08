var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');

var STASH_NAME = 'starflow-tmp';

function Stash() {

}

Stash.prototype.getStashId = function getStashId() {
  return new Task(spawnFactory(), ['git', ['stash', 'list']], '$')
    .run()
    .then(function (flow) {
      var pattern = '^stash@\\{(\\d+)\\}\\: (?:.+\\: )' + STASH_NAME;
      var stashLines = flow.lastShellOutput ? flow.lastShellOutput.split('\n') : [];
      var matches;
      for (var i = 0, len = stashLines.length; i < len; i++) {
        if (!_.isEmpty(stashLines[i])) {
          matches = stashLines[i].match(new RegExp(pattern));
          if (matches) {
            _.set(flow, 'git.starflowTmpStashId', matches[1]);
            i = len;
          }
        }
      }
      return flow;
    });
};

Stash.prototype.stash = function stash(isPop) {
  function onError(err) {
    if (!/No stash found/.test(err.message)) {
      throw err;
    }
    return starflow.flow;
  }

  var promise = isPop ? this.getStashId.bind(this) : Q.bind(starflow.flow);

  return promise()
    .then(function (flow) {
      var gitArgs = ['stash', (isPop ? 'pop' : 'save'), (isPop ? 'stash@{' + flow.git.starflowTmpStashId + '}' : STASH_NAME)];
      return new Task(spawnFactory(), ['git', gitArgs], '$').run();
    })
    .catch(onError);
};

Stash.prototype.exec = function exec(isPop) {
  return this.stash(!!isPop);
};

module.exports = function () {
  return new Stash();
};
