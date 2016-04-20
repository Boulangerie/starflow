var _ = require('lodash');
var starflow = require('../starflow');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var checkoutFactory = require('../git/checkout');
var BaseExecutable = require('../BaseExecutable');

function CreateBranch(name, parentNamespace, options) {
  BaseExecutable.call(this, name, parentNamespace);
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}
CreateBranch.prototype = Object.create(BaseExecutable.prototype);
CreateBranch.prototype.constructor = CreateBranch;

CreateBranch.prototype.createBranch = function createBranch(branchName) {
  function onCreateBranchSuccess() {
    starflow.logger.log('Git branch created: ' + branchName);
    this.storage.set('branchName', branchName);
  }
  function onCreateBranchErr(err) {
    if (!/already exists/.test(err.message)) {
      throw err;
    }
    starflow.logger.warning('Could not create the branch because it already exists');
  }

  var options = this.options;
  var spawnConfig = {
    cmd: 'git',
    args: ['branch', branchName],
    options: {
      cwd: options.cwd
    }
  };
  return new Task(spawnFactory(this.namespace), spawnConfig)
    .run()
    .then(onCreateBranchSuccess.bind(this), onCreateBranchErr);
};

CreateBranch.prototype.checkout = function checkout(branchName) {
  return new Task(checkoutFactory({cwd: this.options.cwd}), [branchName]).run()
};

CreateBranch.prototype.exec = function exec(branchName, withCheckout) {
  var promise = this.createBranch(branchName);
  if (withCheckout) {
    promise = promise.then(this.checkout.bind(this, branchName));
  }
  return promise;
};

module.exports = function (parentNamespace, options) {
  return new CreateBranch('git.createBranch', parentNamespace, options);
};
