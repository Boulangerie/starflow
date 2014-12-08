/**
 * Class to wrap service such as git, jira...
 * @param {String} name
 * @param {ServiceManager} manager
 * @param {Object} api
 */
var Service = function (name, manager, api) {
  this.name = name;
  this.manager = manager;
  this.api = api;
  this.steps = [];
  this.commands = {};
};

/**
 * Register a step that will be run before the dev workflow config steps
 * @param  {Object} step
 */
Service.prototype.registerStep = function (step) {
  var _ = require('lodash');

  if (_.isString(step)) {
    this.steps.push(this.name + '.' + step);
  }
  else {
    // transform { "command": { arg: 42 } } into { "service.command": { arg: 42 } }
    var formattedStep = {};
    var key = Object.keys(step)[0];
    formattedStep[this.name + '.' + key] = step[key];
    this.steps.push(formattedStep);
  }
  return this;
};
Service.prototype.registerCommand = function (name, fn) {
  this.commands[name] = fn;
  return this;
};

module.exports = Service;