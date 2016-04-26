var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function CurrentBranch(parentNamespace, options) {
  BaseExecutable.call(this, 'git.currentBranch', parentNamespace);
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}
CurrentBranch.prototype = Object.create(BaseExecutable.prototype);
CurrentBranch.prototype.constructor = CurrentBranch;

CurrentBranch.prototype.currentBranch = function currentBranch() {
  var spawnExecutableInstance = spawnFactory(this.namespace);

  function onSuccess() {
    var branchName = String(spawnExecutableInstance.storage.getLast('lastShellOutput')).trim();
    starflow.logger.log('Current git branch: ' + branchName);
    this.storage.set('currentBranchName', branchName);
  }

  var options = this.options;
  var spawnConfig = {
    cmd: 'git',
    args: ['rev-parse', '--abbrev-ref', 'HEAD'],
    options: {
      cwd: options.cwd
    }
  };
  return new Task(spawnExecutableInstance, spawnConfig, null, 'git rev-parse --abbrev-ref HEAD')
    .run()
    .then(onSuccess.bind(this));
};

CurrentBranch.prototype.exec = function exec() {
  return this.currentBranch();
};

module.exports = function (parentNamespace, options) {
  return new CurrentBranch(parentNamespace, options);
};
