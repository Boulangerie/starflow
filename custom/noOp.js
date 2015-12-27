function NoOp() {}

NoOp.prototype.exec = function () {
  return true;
};

module.exports = function () {
  return new NoOp();
};
