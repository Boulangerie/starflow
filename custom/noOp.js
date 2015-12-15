var _ = require('lodash');
var Q = require('q');

function NoOp() {

}

NoOp.prototype.exec = function () {
  return Q();
};

module.exports = function () {
  return new NoOp();
};
