var _ = require('lodash');
var Promise = require('bluebird');
var chalk = require('chalk');
var FactoryStore = require('./FactoryStore');
var Task = require('./Task');
var Storage = require('./Storage');

function Workflow(steps, initialWorkspace) {
  this.steps = steps || [];
  this.storage = new Storage(initialWorkspace);
}

Workflow.prototype.run = function run() {
  var steps = formatSteps(this.steps);
  var self = this;
  return _.reduce(steps, function (prev, current) {
      return prev.then(function () {
        return self.processStep(current);
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

Workflow.stepToTask = function stepToTask(step) {
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

  return new Task(taskFactory(), taskArgs, taskName);
};

Workflow.prototype.processStep = function processStep(step) {
  var task = Workflow.stepToTask(step);
  this.storage.addChild(task.instance.name, task.instance.storage);
  return task.run();
};

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

module.exports = Workflow;
