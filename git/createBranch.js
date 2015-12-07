var Q = require('q');
var _ = require('lodash');
var starflow = require('../starflow');
var spawnFactory = require('../shell/spawn');
var checkoutFactory = require('../git/checkout');

function CreateBranch() {

}

CreateBranch.prototype.createBranch = function createBranch(branchName) {
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
  return starflow.wrapTask(checkoutFactory, taskConfig)();
};

CreateBranch.prototype.exec = function exec(branchName, withCheckout) {
  var promise = this.createBranch(branchName);
  if (withCheckout) {
    promise = promise.then(this.checkout.bind(this, branchName));
  }
  return promise;
};

module.exports = function () {
  return new CreateBranch();
};
