var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');

function NoOp() {

}

NoOp.prototype.exec = function () {
  return starflow.flow;
};

module.exports = function () {
  return new NoOp();
};
