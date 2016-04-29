var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var BaseExecutable = require('../BaseExecutable');

function Fetch(options) {
  BaseExecutable.call(this, 'git.fetch');
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}
Fetch.prototype = Object.create(BaseExecutable.prototype);
Fetch.prototype.constructor = Fetch;

Fetch.prototype.fetch = function fetch(remote, branch) {
  var options = this.options;
  var spawnConfig = {
    cmd: 'git',
    args: ['fetch', remote],
    options: {
      cwd: options.cwd
    }
  };
  // if no specific branch, then fetch every branch on specified remote
  if (branch) {
    spawnConfig.args.push(branch);
  }
  var executableChild = spawnFactory();
  this.addChild(executableChild);
  return new Task(executableChild, spawnConfig).run();
};

Fetch.prototype.exec = function exec(remote, branch) {
  remote = remote || 'origin';
  return this.fetch(remote, branch);
};

module.exports = function (options) {
  return new Fetch(options);
};
