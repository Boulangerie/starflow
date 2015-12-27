var Task = require('../Task');
var spawnFactory = require('../shell/spawn');
var starflow = require('../starflow');

function Checkout() {}

Checkout.prototype.checkout = function checkout(branchName) {
  function onSuccess() {
    starflow.logger.log('Checked out to branch "' + branchName + '"');
  }
  return new Task(spawnFactory(), ['git', ['checkout', branchName]])
    .run()
    .then(onSuccess);
};

Checkout.prototype.exec = function exec(branchName) {
  branchName = branchName || 'master';
  return this.checkout(branchName);
};

module.exports = function () {
  return new Checkout();
};
