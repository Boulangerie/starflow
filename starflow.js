var Q = require('q');
var _ = require('lodash');
var Logger = require('./Logger');
var Task = require('./Task');
var chalk = require('chalk');

Q.longStackSupport = true;

var publicApi = {
  flow: {},
  logger: new Logger(),
  init: init,
  register: register,
  runWorkflow: runWorkflow,
  processStep: processStep,
  stepToTask: stepToTask
};
var taskFactories = {};
var workflow = [];

function init(userWorkflow, userFlow) {
  workflow = userWorkflow;
  publicApi.flow = userFlow;
  return publicApi;
}

function register(names, taskFactory) {
  if (_.isString(names)) {
    names = [names];
  }
  _.forEach(names, function (name) {
    if (taskFactories[name]) {
      console.log(chalk.yellow('Overriding the factory associated with the task "' + name + '". Make sure you are registering tasks with different names to avoid this.'));
    }
    taskFactories[name] = taskFactory;
  });

  return publicApi;
}

function runWorkflow() {
  return _.reduce(workflow, function (prev, current) {
    return prev.then(function () {
      return processStep(current);
    });
  }, Q(publicApi.flow))
    .then(function (flow) {
      console.log(chalk.black.bgGreen('\n SUCCESS ') + chalk.green(' Sequence finished successfully'));
      return flow;
    })
    .fail(function (err) {
      console.log(chalk.black.bgRed('\n ERROR ') + chalk.red(' ' + err.message));
      throw err;
    });
}

function processStep(step) {
  var task = stepToTask(step);
  task.interpolate(publicApi.flow);
  return task.run();
}

function stepToTask(step) {
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

  var taskFactory = taskFactories[taskName];
  if (!taskFactory) {
    throw new Error('Cannot find the factory for task "' + taskName + '". Did you register it to Starflow?');
  }

  return new Task(taskFactory(), taskArgs, taskName);
}

module.exports = publicApi;
