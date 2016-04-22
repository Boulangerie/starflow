var StorageProxy = require('./StorageProxy');

function BaseExecutable(name, parentNamespace) {
  this.name = name;
  this.parentNamespace = parentNamespace;
  this.namespace = _.compact([parentNamespace, name]).join('/');
  this.storage = new StorageProxy(this.namespace);
}

BaseExecutable.prototype.exec = function exec() {
  throw new Error('The "exec" method must be implemented.');
};

module.exports = BaseExecutable;
