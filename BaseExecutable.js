var _ = require('lodash');
var Storage = require('./Storage');

function BaseExecutable(name) {
  this.name = name;
  this.storage = new Storage();
}

BaseExecutable.prototype.addChild = function addChild(executable) {
  this.storage.addChild(executable.name, executable.storage);
};

BaseExecutable.prototype.exec = function exec() {
  throw new Error('The "exec" method must be implemented.');
};

module.exports = BaseExecutable;
