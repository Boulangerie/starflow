var _ = require('lodash');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function Checkout(parentNamespace, options) {
  BaseExecutable.call(this, 'git.checkout', parentNamespace);
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}
Checkout.prototype = Object.create(BaseExecutable.prototype);
Checkout.prototype.constructor = Checkout;

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
  return new Task(spawnFactory(this.namespace), spawnConfig)
    .run()
    .then(onSuccess);
};

Checkout.prototype.exec = function exec(branchName) {
  branchName = branchName || 'master';
  return this.checkout(branchName);
};

module.exports = function (parentNamespace, options) {
  return new Checkout(parentNamespace, options);
};
