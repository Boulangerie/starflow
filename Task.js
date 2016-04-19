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

Task.prototype.interpolate = function interpolate(context) {
  // parse each argument with Mustache
  this.args = _.map(this.args, function (arg) {
    if (_.isString(arg)) {
      _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
      arg = _.template(arg)(context);
    }
    else if(_.isArray(arg)){
      var embeddedArgs = {args : arg};
      Task.prototype.interpolate.call(embeddedArgs, context);
      arg = embeddedArgs.args;
    }
    return arg;
  });
};

Task.prototype.run = function run() {
  var starflow = require('./starflow');
  var logger = starflow.logger;

  this.interpolate(starflow.config);

  var self = this;

  if (!_.isFunction(this.instance.exec)) {
    throw new Error('The exec property of "' + this.name + '" must be a function');
  }

  if (starflow.config.muteDepth >= 0 && starflow.config.muteDepth === logger.depth) {
    logger.mute();
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

  var execResult = self.instance.exec.apply(self.instance, self.args);

  return Promise.resolve(execResult)
    .then(function () {
      logger.footer(logger.SUCCESS_MESSAGE);
      if (starflow.config.muteDepth >= 0 && starflow.config.muteDepth === logger.depth) {
        logger.unmute();
      }
    }, function (err) {
      logger.footer(logger.ERROR_MESSAGE);
      if (starflow.config.muteDepth >= 0 && starflow.config.muteDepth === logger.depth) {
        logger.unmute();
      }
      throw err;
    });
};

module.exports = Task;
