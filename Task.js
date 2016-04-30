var _ = require('lodash');
var Promise = require('bluebird');
var Item = require('./Item');

function Task(instance, args, name, description) {
  this.instance = instance || null;
  this.args = args || [];

  // if args is not an array, transform it in an array of 1 element
  if (!_.isArray(this.args)) {
    this.args = [this.args];
  }

  this.name = name || '';
  this.description = description || '';
}

Task.prototype = Object.create(Item.prototype);
Task.prototype.instance = null;
Task.prototype.args = [];
Task.prototype.name = '';
Task.prototype.description = '';

Task.prototype.interpolate = function interpolate(storage) {
  storage = storage || this.instance.storage;

  this.args = _.map(this.args, function (arg) {
    if (_.isString(arg)) {
      if (_.startsWith(arg, '::')) {
        // if the arg starts with "::/" then it's a path from the root storage
        // otherwise ("::") it's from the executable instance storage
        var path = arg.replace(/^::/, '');
        var isRootPath = _.startsWith(path, '/');
        arg = isRootPath ? storage.root.get(path.replace(/^\//, '')) : storage.get(path);
      } else {
        var interpolateRegex = /{{([\s\S]+?)}}/g;
        var matches = interpolateRegex.exec(arg);
        var alteredArg = arg;
        while (matches !== null) {
          var value = _.startsWith(matches[1], '/') ? storage.root.get(matches[1].replace(/^\//, '')) : storage.get(matches[1]);
          alteredArg = alteredArg.replace(matches[0], value);
          matches = interpolateRegex.exec(arg);
        }
        arg = alteredArg;
      }
    } else if (_.isArray(arg)) {
      // if the arg is an array then apply interpolate on each of its elements
      var embeddedArgs = {args : arg};
      Task.prototype.interpolate.call(embeddedArgs, storage);
      arg = embeddedArgs.args;
    }
    return arg;
  });
};

Task.prototype.run = function run() {
  var starflow = require('./starflow');
  var logger = starflow.logger;

  this.interpolate();

  if (!_.isFunction(this.instance.exec)) {
    throw new Error('The exec property of "' + this.name + '" must be a function');
  }

  var headerMessage;
  if (this.description) {
    headerMessage = this.description;
  } else if (this.name) {
    headerMessage = this.name + ' ' + logger.logArgsStr(this.args);
  } else {
    headerMessage = '<internal task>';
  }

  logger.header(headerMessage);

  var execResult = this.instance.exec.apply(this.instance, this.args);

  return Promise.resolve(execResult)
    .then(function () {
      logger.footer(logger.SUCCESS_MESSAGE);
    }, function (err) {
      logger.footer(logger.ERROR_MESSAGE);
      throw err;
    });
};

module.exports = Task;
