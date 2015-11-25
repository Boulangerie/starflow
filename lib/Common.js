module.exports = (function (_, Q, chalk, mustache, Logger) {
  'use strict';

  var _mapTaskCallback = {};

  /**
   * Extract the name and args of a task config
   * @param  {string|object} taskConfig
   * @return {object}
   */
  function _extractTask(taskConfig) {
    var taskName = '';
    var taskArgs = [];

    if (_.isString(taskConfig)) {
      taskName = taskConfig;
    } else if (_.isObject(taskConfig)) { // task is an object
      taskName = _.first(_.keys(taskConfig));
      if (_.isString(taskConfig[taskName])) {
        taskArgs = [taskConfig[taskName]];
      } else if (_.isArray(taskConfig[taskName])) { // args is an array
        taskArgs = taskConfig[taskName];
      } else { // args are neither string or array
        throw new Error('The args for the task "' + taskName + '" must be a string or an array');
      }
    } else { // task is neither string or object
      throw new Error('The task "' + taskConfig + '" must be a string or an object');
    }

    return {
      name: taskName,
      args: taskArgs
    };
  }

  function init(map) {
    _mapTaskCallback = map;
  }

  function taskWrapper(task, flow, previousDependencies, withLogs, requiredBy) {
    withLogs = _.isUndefined(withLogs) ? true : withLogs;
    // try getting the task definition
    try {
      var command = require(_mapTaskCallback[task.name]);
    } catch (err) {
      console.log(chalk.red('Could not load the task "' + task.name + '"'));
      throw err;
    }

    command.name = task.name;

    // parse each argument with Mustache
    task.args = _.map(task.args, function (arg) {
      if (_.isString(arg)) {
        arg = mustache.render(arg, flow);
      }
      return arg;
    });

    // return a promise factory for the task
    return function promiseFactory() {
      // cannot simply use "_.cloneDeep(flow)" because for API objects (e.g. node-jira for jira.setApiInstance)
      // we get a "cannot call method apply of undefined" error. The trick: set an "isShared" property to true to the
      // API object (e.g. see jira.setApiInstance and github.setApiInstance) so the cloneDeep callback doesn't clone it
      task.args.unshift(_.cloneDeep(flow, function (val) {
        return (_.isObject(val) && val.isShared) ? val : undefined;
      }));
      return command.exec(task.args, previousDependencies, withLogs, requiredBy);
    };
  }

  /**
   * Run a promise sequence according to a list of task configs
   * @param  {array} tasks
   * @param  {object} flow
   * @param  {array} previousDependencies
   * @param  {string} requiredBy
   * @return {Q.promise}
   */
  function runSequence(tasks, flow, previousDependencies, requiredBy) {
    previousDependencies = previousDependencies || [];

    tasks = _.map(tasks, function (task) {
      return _extractTask(task);
    });

    var withLogs;
    return _.reduce(tasks, function (prev, current) {
      return prev.then(function (res) {
        withLogs = _.isUndefined(current.withLogs) ? true : current.withLogs;
        return taskWrapper(current, res, previousDependencies, withLogs, requiredBy)();
      });
    }, Q(flow));
  }

  /**
   * Throws an error with "mandatory field" text
   * @param key
   * @param value
   * @param contextTask
   */
  function throwMandatory(key, value, contextTask) {
    throw new Error('The ' + key + ' is mandatory (got "' + value + '" for task ' + contextTask.name + ')');
  }

  return {
    init: init,
    taskWrapper: taskWrapper,
    runSequence: runSequence,
    throwMandatory: throwMandatory
  };
})(require('lodash'), require('q'), require('chalk'), require('mustache'), require('./Logger'));
