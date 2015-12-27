var _ = require('lodash');
var mustache = require('mustache');

function Task(instance, args, name, description) {
  this.instance = instance || null;
  this.args = args || [];
  this.name = name || '';
  this.description = description || '';
}

Task.prototype.instance = null;
Task.prototype.args = [];
Task.prototype.name = '';
Task.prototype.description = '';

Task.prototype.interpolate = function interpolate(context) {
  // parse each argument with Mustache
  this.args = _.map(this.args, function (arg) {
    if (_.isString(arg)) {
      // FIXME do not escape HTML special characters like "<", ">" and "/"
      //arg = arg.replace(/\{\{([^&])/g, '{{&\$1');
      arg = mustache.render(arg, context);
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

  return self.instance.exec.apply(self.instance, self.args)
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
