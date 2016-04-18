var _ = require('lodash');
var chalk = require('chalk');

var publicApi = {
  add: add,
  remove: remove,
  get: get
};

var taskFactories = [];

function add(names, taskFactory) {
  if (_.isString(names)) {
    names = [names];
  }
  _.forEach(names, function (name) {
    if (taskFactories[name]) {
      console.log(chalk.yellow('Overriding the factory associated with the task "' + name + '". Make sure you are registering tasks with different names to avoid this.'));
    }
    taskFactories[name] = taskFactory;
  });
}

function remove(names) {
  if (_.isString(names)) {
    names = [names];
  }
  _.forEach(names, function (name) {
    if (taskFactories[name]) {
      delete taskFactories[name];
    }
  });
}

function get(name) {
  return _.get(taskFactories, name);
}

module.exports = publicApi;
