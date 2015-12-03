var Q = require('q');
var _ = require('lodash');
var Logger = require('./Logger');
var Sequence = require('./Sequence');
var Task = require('./Task');
var chalk = require('chalk');

Q.longStackSupport = true;

function Starflow(workflow, flow) {
  this.tasks = {};
  this.workflow = workflow || [];
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

Starflow.prototype.run = function run() {
  var self = this;

  return _.reduce(this.workflow, function (prev, current) {
    return prev.then(function () {
      return self.processStep(current);
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

Starflow.prototype.processStep = function processStep(step) {
  var task = this.stepToTask(step);

  var taskFactory = this.tasks[task.name];
  if (!taskFactory) {
    throw new Error('Cannot find the factory for task "' + task.name + '". Did you register it to Starflow?');
  }

  task.interpolate(this.flow);

  return this.task.run();
};

Starflow.prototype.stepToTask = function stepToTask(step) {
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

  return new Task(this.tasks[taskName], taskArgs, taskName);
};

Starflow.prototype.isRegistered = function isRegistered(taskName) {
  return !!this.tasks[taskName];
};

module.exports = Starflow;
