var _ = require('lodash');
var Storage = require('./Storage');

function BaseExecutable(name) {
  this.name = name;
  this.storage = new Storage(name);
  // whether the Executable has been created in a workflow or by hand by the user
  // if created by a workflow then initiator is a reference to this workflow
  this.initiator = null;
}

BaseExecutable.prototype.addChild = function addChild(executable) {
  this.storage.addChild(executable.name, executable.storage);
};

BaseExecutable.prototype.exec = function exec() {
  throw new Error('The "exec" method must be implemented.');
};

module.exports = BaseExecutable;
