var _ = require('lodash');
var mustache = require('mustache');
var starflow = require('./starflow');
var logger = starflow.logger;

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
    return arg;
  });
};

Task.prototype.run = function run() {
  var self = this;

  if (!_.isFunction(this.instance.exec)) {
    throw new Error('The exec property of "' + this.name + '" must be a function');
  }

  if (starflow.flow.muteDepth >= 0 && starflow.flow.muteDepth === starflow.logger.depth) {
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

  // wrap in a Q.fcall() to catch the errors correctly
  return Q.fcall(function () {
      return self.instance.exec(self.args);
    })
    .then(function (flow) {
      logger.footer(logger.SUCCESS_MESSAGE);
      if (starflow.flow.muteDepth >= 0 && starflow.flow.muteDepth === logger.depth) {
        logger.unmute();
      }
      return flow;
    }, function (err) {
      if (err === starflow.flow) { // e.g. git.createBranch when branch already exists
        logger.footer(logger.SUCCESS_MESSAGE);
        if (starflow.flow.muteDepth >= 0 && starflow.flow.muteDepth === logger.depth) {
          logger.unmute();
        }
        return flow;
      } else {
        logger.footer(logger.ERROR_MESSAGE);
        if (starflow.flow.muteDepth >= 0 && starflow.flow.muteDepth === logger.depth) {
          logger.unmute();
        }
        throw err;
      }
    });
};

module.exports = Task;
