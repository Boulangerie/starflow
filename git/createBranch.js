var _ = require('lodash');
var starflow = require('../starflow');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var checkoutFactory = require('../git/checkout');

function CreateBranch(options) {
  this.options = _.defaults({}, options, {
    cwd: './'
  });
}

CreateBranch.prototype.createBranch = function createBranch(branchName) {
  function onCreateBranchSuccess() {
    starflow.logger.log('Git branch created: ' + branchName);
    _.set(starflow.config, 'git.createdBranch', branchName);
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
  return new Task(spawnFactory(), spawnConfig)
    .run()
    .then(onCreateBranchSuccess, onCreateBranchErr);
};

CreateBranch.prototype.checkout = function checkout(branchName) {
  return new Task(checkoutFactory(this.options.cwd), [branchName]).run()
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
