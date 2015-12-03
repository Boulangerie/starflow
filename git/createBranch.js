var Q = require('q');
var _ = require('lodash');
var spawnFactory = require('../shell/spawn');
var checkoutFactory = require('../git/checkout');

function CreateBranch(starflow) {
  this.starflow = starflow;
}

CreateBranch.prototype.createBranch = function createBranch(branchName) {
  var starflow = this.starflow;

  function onCreateBranchSuccess() {
    starflow.logger.log('Git branch created: ' + branchName);
    _.set(starflow.flow, 'git.createdBranch', branchName);
    return starflow.flow;
  }
  function onCreateBranchErr(err) {
    if (!/already exists/.test(err.message)) {
      throw err;
    }
    starflow.logger.warning('Could not create the branch because it already exists');
    return starflow.flow;
  }

  var taskConfig = {args: ['git', ['branch', branchName]]};
  return starflow.wrapTask(spawnFactory, taskConfig)()
    .then(onCreateBranchSuccess, onCreateBranchErr);
}

CreateBranch.prototype.checkout = function checkout(branchName) {
  var taskConfig = {args: [branchName]};
  return this.starflow.wrapTask(checkoutFactory, taskConfig)();
};

CreateBranch.prototype.exec = function exec(branchName, withCheckout) {
  var promise = this.createBranch(branchName);
  if (withCheckout) {
    promise = promise.then(this.checkout.bind(this, branchName));
  }
  return promise;
};

module.exports = CreateBranch;
