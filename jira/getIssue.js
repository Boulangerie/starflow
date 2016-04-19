var _ = require('lodash');
var Promise = require('bluebird');
var starflow = require('../starflow');
var Task = require('../Task');
var BaseExecutable = require('../BaseExecutable');

function GetIssue(name, parentNamespace, api) {
  BaseExecutable.call(this, name, parentNamespace);
  this.api = api;
}
GetIssue.prototype = Object.create(BaseExecutable.prototype);
GetIssue.prototype.constructor = GetIssue;

GetIssue.prototype.getIssue = function getIssue(key) {
  function onSuccess(issue) {
    starflow.logger.success('JIRA issue "' + key + '" was found');
    var type = _.get(issue, 'fields.issuetype.name', 'Unknown type');
    var assignee = !_.isNull(_.get(issue, 'fields.assignee')) ? _.get(issue, 'fields.assignee.name') : 'Nobody';
    starflow.logger.log('<' + type + '> ' + _.get(issue, 'fields.summary') + ' (assigned to ' + assignee + ', status: ' + _.get(issue, 'fields.status.name') + ')');
    this.storage.set('issue', issue);
  }

  function onError(err) {
    starflow.logger.error('JIRA issue "' + key + '" was not found');
    throw err;
  }
  var jiraFindIssue = Promise.promisify(this.api.findIssue, {context: this.api});
  return jiraFindIssue(key)
    .then(onSuccess.bind(this), onError);
};

GetIssue.prototype.openJiraLink = function openJiraLink(key) {
  var spawnFactory = require('../shell/spawn');
  var url = this.api.protocol + '://' + this.api.host + '/browse/' + key;
  var taskConfig = ['open', url];
  return new Task(spawnFactory(this.namespace), taskConfig).run();
};

GetIssue.prototype.exec = function exec(key, withOpen) {
  if (_.isEmpty(key)) {
    throw new Error('JIRA issue key is required');
  }

  var promise = this.getIssue(key);
  if (withOpen) {
    promise = promise.then(this.openJiraLink.bind(this, key));
  }
  return promise;
};

module.exports = function (api) {
  return function (parentNamespace) {
    return new GetIssue('jira.getIssue', parentNamespace, api);
  };
};
