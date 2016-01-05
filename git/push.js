var Task = require('../Task');
var spawnFactory = require('../shell/spawn');

function Push() {

}

Push.prototype.push = function push(remote, branch) {
  return new Task(spawnFactory(), ['git', ['push', '-u', remote, branch]]).run();
};

Push.prototype.exec = function exec(remote, branch) {
  remote = remote || 'origin';
  if (!branch) {
    throw new Error('The branch name is required');
  }
  return this.push(remote, branch);
};

module.exports = function () {
  return new Push();
};
