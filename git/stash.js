var _ = require('lodash');
var Promise = require("bluebird");
var starflow = require('../starflow');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');

var STASH_NAME = 'starflow-tmp';
var STASH_ID_UNDEFINED_MESSAGE = 'Could not find any stash ID for starflow-tmp';

function Stash(options) {
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}

Stash.prototype.getStashId = function getStashId() {
  var options = this.options;
  var spawnConfig = {
    cmd: 'git',
    args: ['stash', 'list'],
    options: {
      cwd: options.cwd
    }
  };
  return new Task(spawnFactory(), spawnConfig, '$')
    .run()
    .then(function () {
      var pattern = '^stash@\\{(\\d+)\\}\\: (?:.+\\: )' + STASH_NAME;
      var stashLines = starflow.config.lastShellOutput ? starflow.config.lastShellOutput.split('\n') : [];
      var matches;
      _.forEach(stashLines, function (line) {
        matches = line.match(new RegExp(pattern));
        if (matches) {
          _.set(starflow.config, 'git.starflowTmpStashId', matches[1]);
          return false;
        }
      });

      if (_.isUndefined(starflow.config.git) || (starflow.config.git && _.isUndefined(starflow.config.git.starflowTmpStashId))) {
        throw new Error(STASH_ID_UNDEFINED_MESSAGE);
      }
    });
};

Stash.prototype.stash = function stash(isPop) {
  function onStashError(err) {
    if (!/No stash found/.test(err.message)) {
      throw err;
    }
    starflow.logger.warning('Nothing was stashed');
  }

  var options = this.options;
  function onGetStashIdSuccess() {
    var spawnConfig = {
      cmd: 'git',
      args: ['stash', (isPop ? 'pop' : 'save'), (isPop ? 'stash@{' + starflow.config.git.starflowTmpStashId + '}' : STASH_NAME)],
      options: {
        cwd: options.cwd
      }
    };
    return new Task(spawnFactory(), spawnConfig, '$').run();
  }

  function onGetStashIdError(err) {
    if (err.message !== STASH_ID_UNDEFINED_MESSAGE) {
      throw err;
    }
    starflow.logger.warning('No starflow-tmp stash was found');
  }
  //@todo: Test this case when isPop is false
  var promise = isPop ? this.getStashId.bind(this) : Promise.resolve;

  return promise()
    .then(onGetStashIdSuccess, onGetStashIdError)
    .catch(onStashError);
};

Stash.prototype.exec = function exec(isPop) {
  return this.stash(!!isPop);
};

module.exports = function (options) {
  return new Stash(options);
};
