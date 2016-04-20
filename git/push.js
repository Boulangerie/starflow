var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var BaseExecutable = require('../BaseExecutable');

function Push(name, parentNamespace, options) {
  BaseExecutable.call(this, name, parentNamespace);
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
  return new Task(spawnFactory(this.namespace), spawnConfig).run();
};

Push.prototype.exec = function exec(remote, branch) {
  remote = remote || 'origin';
  if (!branch) {
    throw new Error('The branch name is required');
  }
  return this.push(remote, branch);
};

module.exports = function (parentNamespace, options) {
  return new Push('git.push', parentNamespace, options);
};
