var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');

function Push(options) {
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}

Push.prototype.push = function push(remote, branch) {
  var options = this.options;
  var spawnConfig = {
    cmd: 'git',
    args: ['push', '-u', remote, branch],
    options: {
      cwd: options.cwd
    }
  };
  return new Task(spawnFactory(), spawnConfig).run();
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
