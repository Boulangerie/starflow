var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');

function Fetch(options) {
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}

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
  return new Task(spawnFactory(), spawnConfig).run();
};

Fetch.prototype.exec = function exec(remote, branch) {
  remote = remote || 'origin';
  return this.fetch(remote, branch);
};

module.exports = function (options) {
  return new Fetch(options);
};
