var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var starflow = require('../starflow');

function CurrentBranch(options) {
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}

CurrentBranch.prototype.currentBranch = function currentBranch() {
  function onSuccess() {
    var branchName = String(starflow.config.lastShellOutput).trim();
    starflow.logger.log('Current git branch: ' + branchName);
    _.set(starflow.config, 'git.currentBranch', branchName);
  }

  var options = this.options;
  var spawnConfig = {
    cmd: 'git',
    args: ['rev-parse', '--abbrev-ref', 'HEAD'],
    options: {
      cwd: options.cwd
    }
  };
  return new Task(spawnFactory(), spawnConfig, null, 'git rev-parse --abbrev-ref HEAD')
    .run()
    .then(onSuccess);
};

CurrentBranch.prototype.exec = function exec() {
  return this.currentBranch();
};

module.exports = function (options) {
  return new CurrentBranch(options);
};
