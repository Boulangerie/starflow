var _ = require('lodash');
var starflow = require('../starflow');
var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var checkoutFactory = require('../git/checkout');

function CreateBranch() {

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

  return new Task(spawnFactory(), ['git', ['branch', branchName]])
    .run()
    .then(onCreateBranchSuccess, onCreateBranchErr);
};

CreateBranch.prototype.checkout = function checkout(branchName) {
  return new Task(checkoutFactory(), [branchName]).run()
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
