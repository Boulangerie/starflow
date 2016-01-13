var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var starflow = require('../starflow');

function Checkout(options) {
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}

Checkout.prototype.checkout = function checkout(branchName) {
  function onSuccess() {
    starflow.logger.log('Checked out to branch "' + branchName + '"');
  }
  var options = this.options;
  var spawnConfig = {
    cmd: 'git',
    args: ['checkout', branchName],
    options: {
      cwd: options.cwd
    }
  };
  return new Task(spawnFactory(), spawnConfig)
    .run()
    .then(onSuccess);
};

Checkout.prototype.exec = function exec(branchName) {
  branchName = branchName || 'master';
  return this.checkout(branchName);
};

module.exports = function (options) {
  return new Checkout(options);
};
