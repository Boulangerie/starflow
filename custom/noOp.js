var BaseExecutable = require('../BaseExecutable');

function NoOp(parentNamespace) {
  BaseExecutable.call(this, 'noOp', parentNamespace);
}
NoOp.prototype = Object.create(BaseExecutable.prototype);
NoOp.prototype.constructor = NoOp;

NoOp.prototype.exec = function exec() {
  return true;
};

module.exports = function factory(parentNamespace) {
  return new NoOp(parentNamespace);
};
