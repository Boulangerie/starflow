var Promise = require("bluebird");

function NoOp() {}

NoOp.prototype.exec = function () {
  return new Promise();
};

module.exports = function () {
  return new NoOp();
};
