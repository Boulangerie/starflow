var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');

var STASH_NAME = 'starflow-tmp';
var STASH_ID_UNDEFINED_MESSAGE = 'Could not find any stash ID for starflow-tmp';

function Stash() {

}

Stash.prototype.getStashId = function getStashId() {
  return new Task(spawnFactory(), ['git', ['stash', 'list']], '$')
    .run()
    .then(function (flow) {
      var pattern = '^stash@\\{(\\d+)\\}\\: (?:.+\\: )' + STASH_NAME;
      var stashLines = flow.lastShellOutput ? flow.lastShellOutput.split('\n') : [];
      var matches;
      _.forEach(stashLines, function (line) {
        matches = stashLines[i].match(new RegExp(pattern));
        if (matches) {
          _.set(flow, 'git.starflowTmpStashId', matches[1]);
          return false;
        }
      });

      if (_.isUndefined(flow.git) || (flow.git && _.isUndefined(flow.git.starflowTmpStashId))) {
        throw new Error(STASH_ID_UNDEFINED_MESSAGE);
      }

      return flow;
    });
};

Stash.prototype.stash = function stash(isPop) {
  function onStashError(err) {
    if (!/No stash found/.test(err.message)) {
      throw err;
    }
    starflow.logger.warning('Nothing was stashed');
    return starflow.flow;
  }

  function onGetStashIdSuccess(flow) {
    var gitArgs = ['stash', (isPop ? 'pop' : 'save'), (isPop ? 'stash@{' + flow.git.starflowTmpStashId + '}' : STASH_NAME)];
    return new Task(spawnFactory(), ['git', gitArgs], '$').run();
  }

  function onGetStashIdError(err) {
    if (err.message !== STASH_ID_UNDEFINED_MESSAGE) {
      throw err;
    }
    starflow.logger.warning('No starflow-tmp stash was found');
    return starflow.flow;
  }

  var promise = isPop ? this.getStashId.bind(this) : Q.bind(starflow.flow);

  return promise()
    .then(onGetStashIdSuccess, onGetStashIdError)
    .catch(onStashError);
};

Stash.prototype.exec = function exec(isPop) {
  return this.stash(!!isPop);
};

module.exports = function () {
  return new Stash();
};
