var _ = require('lodash');
var Promise = require('bluebird');
var chalk = require('chalk');
var FactoryStore = require('./FactoryStore');
var Task = require('./Task');

var publicApi = {
  runSteps: runSteps,
  stepToTask: stepToTask
};

function runSteps(steps) {
  steps = formatSteps(steps);
  return _.reduce(steps, function (prev, current) {
      return prev.then(function () {
        return processStep(current);
      });
    }, Promise.resolve())
    .then(function () {
      console.log(chalk.black.bgGreen('\n SUCCESS ') + chalk.green(' Sequence finished successfully') + ' ');
    })
    .catch(function (err) {
      var message = _.get(err, 'message', err);
      console.log(chalk.black.bgRed('\n ERROR ') + chalk.red(' ' + message + ' '));
      //@todo(GH25): Maybe check the type, debug mode, etc... Before throw it
      throw err;
    });
};

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

  var taskFactory = FactoryStore.get(taskName);
  if (!taskFactory) {
    throw new Error('Cannot find the factory for task "' + taskName + '". Did you register it to Starflow?');
  }

  return new Task(taskFactory(''), taskArgs, taskName);
}

function processStep(step) {
  var task = stepToTask(step);
  return task.run();
}

function formatSteps(steps) {
  var ret;
  if (_.isEmpty(steps)) {
    ret = [];
  }
  else if (!_.isArray(steps)) {
    ret = [steps];
  }
  else {
    ret = steps;
  }
  return ret;
}

module.exports = publicApi;
