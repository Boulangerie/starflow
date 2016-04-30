var BaseExecutable = require('../Executable');

function NoOp() {
  BaseExecutable.call(this, 'noOp');
}
NoOp.prototype = Object.create(BaseExecutable.prototype);
NoOp.prototype.constructor = NoOp;

NoOp.prototype.exec = function exec() {
  return true;
};

module.exports = function factory() {
  return new NoOp();
};
