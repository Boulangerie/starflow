var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var BaseExecutable = require('../Executable');

function Push(options) {
  BaseExecutable.call(this, 'git.push');
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}
Push.prototype = Object.create(BaseExecutable.prototype);
Push.prototype.constructor = Push;

Push.prototype.push = function push(remote, branch) {
  var options = this.options;
  var spawnConfig = {
    cmd: 'git',
    args: ['push', '-u', remote, branch],
    options: {
      cwd: options.cwd
    }
  };
  var executableChild = spawnFactory();
  this.addChild(executableChild);
  return new Task(executableChild, spawnConfig).run();
};

Push.prototype.exec = function exec(remote, branch) {
  remote = remote || 'origin';
  if (!branch) {
    throw new Error('The branch name is required');
  }
  return this.push(remote, branch);
};

module.exports = function (options) {
  return new Push(options);
};
