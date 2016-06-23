var _ = require('lodash');
var Promise = require('bluebird');
var chalk = require('chalk');
var Task = require('./Task');
var Storage = require('./Storage');

function Workflow(steps, initialWorkspace) {
  this.steps = steps || [];
  this.storage = new Storage('root', initialWorkspace);
  this.factories = {};
}

Workflow.prototype.addPlugin = function addPlugin(pluginGetter) {
  // TODO think about giving 'this' instead of starflow?
  var starflow = require('starflow');
  var plugin = pluginGetter(starflow);

  _.forEach(plugin.factories, function (factory) {
    var dummyExecutable = factory();
    this.register(dummyExecutable.name, factory);
  }.bind(this));

  return this;
};

Workflow.prototype.addAliases = function addAliases(aliases, name) {
  if (_.isString(aliases)) {
    aliases = [aliases];
  }
  this.register(aliases, this.getFactory(name));
  return this;
};

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

Workflow.prototype.stepToTask = function stepToTask(step) {
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

  var executableFactory = this.getFactory(taskName);
  if (!executableFactory) {
    throw new Error('Cannot find the factory for task "' + taskName + '". Did you register it to Starflow?');
  }
  
  var executableInstance = executableFactory();
  // TODO messy
  executableInstance.initiator = this;

  return new Task(executableInstance, taskArgs, taskName);
};

Workflow.prototype.processStep = function processStep(step) {
  var task = this.stepToTask(step);
  this.storage.addChild(task.instance.name, task.instance.storage);
  return task.run();
};

Workflow.prototype.register = function register(names, factory) {
  if (_.isString(names)) {
    names = [names];
  }
  _.forEach(names, function (name) {
    if (this.factories[name]) {
      console.log(chalk.yellow('Overriding the factory associated with the task "' + name + '". Make sure you are registering tasks with different names to avoid this.'));
    }
    this.factories[name] = factory;
  }.bind(this));
  return this;
};

Workflow.prototype.unregister = function unregister(names) {
  if (_.isString(names)) {
    names = [names];
  }
  _.forEach(names, function (name) {
    if (this.factories[name]) {
      delete this.factories[name];
    }
  }.bind(this));
  return this;
};

Workflow.prototype.getFactory = function getFactory(name) {
  return _.get(this.factories, name);
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
