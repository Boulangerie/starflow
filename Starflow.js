var Q = require('q');
var _ = require('lodash');
var mustache = require('mustache');
var Logger = require('./Logger');
var chalk = require('chalk');

Q.longStackSupport = true;

function Starflow(sequence, flow) {
  this.tasks = {};
  this.sequence = sequence || [];
  this.flow = flow || {};

  this.logger = new Logger();
}

Starflow.prototype.register = function register(names, taskFactory) {
  var self = this;
  if (_.isString(names)) {
    names = [names];
  }
  _.forEach(names, function (name) {
    if (self.tasks[name]) {
      console.log(chalk.yellow('Overriding the factory associated with the task "' + name + '". Make sure you are registering tasks with different names to avoid this.'));
    }
    self.tasks[name] = taskFactory;
  });

  return this;
};

// Starflow.prototype.runSequences = function runSequences(sequences) {
//   var self = this;
//   return _.reduce(sequences, function (prev, current) {
//     return prev.then(function (flow) {
//       return self.runTasks(current);
//     });
//   }, Q(this.flow));
// };

// Starflow.prototype.runTasks = function runTasks(tasks) {
//   return _.reduce(tasks, function (prev, current) {
//     return prev.then(function (flow) {
//       return current();
//     });
//   }, Q(this.flow));
// };

Starflow.prototype.run = function run() {
  var self = this;

  return _.reduce(this.sequence, function (prev, current) {
    return prev.then(function (flow) {
      return self.processStep(current)();
    });
  }, Q(this.flow))
    .then(function (flow) {
      console.log(chalk.black.bgGreen('\n SUCCESS ') + chalk.green(' Sequence finished successfully'));
      return flow;
    })
    .fail(function (err) {
      console.log(chalk.black.bgRed('\n ERROR ') + chalk.red(' ' + err.message));
      throw err;
    });
};

Starflow.prototype.wrapTask = function wrapTask(taskFactory, step) {
  var self = this;
  // return a promise factory for the task
  return function promiseFactory() {
    var task = taskFactory(self);

    if (!_.isFunction(task.exec)) {
      throw new Error('The exec property of "' + step.name + '" must be a function');
    }

    if (self.flow.muteDepth >= 0 && self.flow.muteDepth === self.logger.depth) {
      self.logger.mute();
    }

    var headerMessage;
    if (step.description) {
      headerMessage = step.description;
    } else if (step.name) {
      headerMessage = step.name + ' ' + self.logger.logArgsStr(step.args);
    } else {
      headerMessage = '<internal task>';
    }

    self.logger.header(headerMessage);
    // wrap in a Q.fcall() to catch the errors correctly
    return Q.fcall(function () {
        return task.exec.apply(task, step.args);
      })
      .then(function (flow) {
        self.logger.footer(Logger.prototype.SUCCESS_MESSAGE);
        if (self.flow.muteDepth >= 0 && self.flow.muteDepth === self.logger.depth) {
          self.logger.unmute();
        }
        return flow;
      }, function (err) {
        if (err === self.flow) { // e.g. git.createBranch when branch already exists
          self.logger.footer(Logger.prototype.SUCCESS_MESSAGE);
          if (self.flow.muteDepth >= 0 && self.flow.muteDepth === self.logger.depth) {
            self.logger.unmute();
          }
          return flow;
        } else {
          self.logger.footer(Logger.prototype.ERROR_MESSAGE);
          if (self.flow.muteDepth >= 0 && self.flow.muteDepth === self.logger.depth) {
            self.logger.unmute();
          }
          throw err;
        }
      });
  };
};

Starflow.prototype.processStep = function processStep(step) {
  var self = this;
  step = this.normalizeStep(step);

  var taskFactory = this.tasks[step.name];
  if (!taskFactory) {
    throw new Error('Cannot find the factory for task "' + step.name + '". Did you register it to Starflow?');
  }

  // parse each argument with Mustache
  step.args = _.map(step.args, function (arg) {
    if (_.isString(arg)) {
      // do not escape HTML special characters like "<", ">" and "/"
      arg = arg.replace(/\{\{([^&])/g, '{{&\$1');
      arg = mustache.render(arg, self.flow);
    }
    return arg;
  });

  return this.wrapTask(taskFactory, step);
};

Starflow.prototype.normalizeStep = function normalizeStep(step) {
  var taskName = '';
  var taskArgs = [];

  if (_.isString(step)) {
    taskName = step;
  } else if (_.isObject(step)) { // task is an object
    taskName = _.first(_.keys(step));
    if (_.isString(step[taskName])) {
      taskArgs = [step[taskName]];
    } else if (_.isArray(step[taskName])) { // args is an array
      taskArgs = step[taskName];
    } else { // args are neither string nor array
      throw new Error('The args for the task "' + taskName + '" must be a string or an array');
    }
  } else { // task is neither string or object
    throw new Error('The task "' + step + '" must be a string or an object');
  }

  return {
    name: taskName,
    args: taskArgs
  };
};

Starflow.prototype.isRegistered = function isRegistered(taskName) {
  return !!this.tasks[taskName];
};

module.exports = Starflow;
