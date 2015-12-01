var _ = require('lodash');
var Q = require('q');

function NoOp(starflow) {
  this.starflow = starflow;
}

NoOp.prototype.exec = function () {
  return this.starflow.flow;
};

module.exports = function noOpFactory(starflow) {
  return new NoOp(starflow);
};
