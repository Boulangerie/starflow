var Logger = require('./Logger');
var FactoryStore = require('./FactoryStore');
var Workflow = require('./Workflow');

var publicApi = {
  config: {},
  logger: new Logger(),
  init: init,
  register: register,
  runWorkflow: runWorkflow
};

function init(userConfig) {
  publicApi.config = userConfig || {};
  return this;
}

function register(names, taskFactory) {
  FactoryStore.add(names, taskFactory);
  return this;
}

function runWorkflow(userWorkflow) {
  return Workflow.runSteps(userWorkflow);
}

module.exports = publicApi;
