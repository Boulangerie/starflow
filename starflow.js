var _ = require('lodash');
var Promise = require("bluebird");
var Logger = require('./Logger');
var Task = require('./Task');
var chalk = require('chalk');

var publicApi = {
  config: {},
  logger: new Logger(),
  init: init,
  register: register,
  runWorkflow: runWorkflow
};

var taskFactories = {};
var workflow = [];

function init(userWorkflow, userConfig) {
  workflow = userWorkflow || [];
  publicApi.config = userConfig || {};
  return this;
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
  }, Promise.resolve())
    .then(function () {
      console.log(chalk.black.bgGreen('\n SUCCESS ') + chalk.green(' Sequence finished successfully') + ' ');
      return publicApi.config;
    })
    .catch(function (err) {
      var message = _.get(err, 'message', err);
      console.log(chalk.black.bgRed('\n ERROR ') + chalk.red(' ' + message + ' '));
      //@todo(GH25): Maybe check the type, debug mode, etc... Before throw it
      throw err;
    });
}

function processStep(step) {
  var task = stepToTask(step);
  task.interpolate(publicApi.config);
  return task.run();
}

function stepToTask(step) {
  var taskName = '';
  var taskArgs = [];

  if (_.isString(step)) {
    taskName = step;
  } else if (_.isObject(step)) { // task is an object
    taskName = _.first(_.keys(step));
    taskArgs = _.isArray(step[taskName]) ? step[taskName] : [step[taskName]];
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
