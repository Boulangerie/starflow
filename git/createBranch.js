var _ = require('lodash');
var starflow = require('../starflow');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var checkoutFactory = require('../git/checkout');
var BaseExecutable = require('../Executable');

function CreateBranch(options) {
  BaseExecutable.call(this, 'git.createBranch');
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}
CreateBranch.prototype = Object.create(BaseExecutable.prototype);
CreateBranch.prototype.constructor = CreateBranch;

CreateBranch.prototype.createBranch = function createBranch(branchName) {
  function onCreateBranchSuccess() {
    starflow.logger.log('Git branch created: ' + branchName);
    this.storage.set('name', branchName);
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
  var executableChild = spawnFactory();
  this.addChild(executableChild);
  return new Task(executableChild, spawnConfig)
    .run()
    .then(onCreateBranchSuccess.bind(this), onCreateBranchErr);
};

CreateBranch.prototype.checkout = function checkout(branchName) {
  var executableChild = checkoutFactory({cwd: this.options.cwd});
  this.addChild(executableChild);
  return new Task(executableChild, [branchName]).run()
};

CreateBranch.prototype.exec = function exec(branchName, withCheckout) {
  var promise = this.createBranch(branchName);
  if (withCheckout) {
    promise = promise.then(this.checkout.bind(this, branchName));
  }
  return promise;
};

module.exports = function (options) {
  return new CreateBranch(options);
};
