var _ = require('lodash');
var Promise = require('bluebird');
var jiraService = require('./JiraService').getInstance();
var starflow = require('../starflow');
var BaseExecutable = require('../Executable');

function GetIssueStatuses() {
  BaseExecutable.call(this, 'jira.getIssueStatuses');
}
GetIssueStatuses.prototype = Object.create(BaseExecutable.prototype);
GetIssueStatuses.prototype.constructor = GetIssueStatuses;

GetIssueStatuses.prototype.getIssueStatuses = function getIssueStatuses(key) {
  var jiraGetIssueStatuses = Promise.promisify(jiraService.listTransitions, {context: jiraService});
  return jiraGetIssueStatuses(key)
    .then(onSuccess.bind(this), onError);

  function onSuccess(issue) {
    starflow.logger.success('JIRA issue statuses "' + key + '" were found');
    var statuses = _.map(issue.transitions, function (status) { return _.get(status, 'to.name'); }).join(', ');
    starflow.logger.log('Statuses: ' + statuses);
    this.storage.set('statuses', issue.transitions);
  }

  function onError(err) {
    starflow.logger.error('JIRA issue "' + key + '" was not found');
    throw err;
  }
};

GetIssueStatuses.prototype.exec = function exec(key) {
  if (_.isEmpty(key)) {
    throw new Error('JIRA issue key is required');
  }
  return this.getIssueStatuses(key);
};

module.exports = function () {
  return function () {
    return new GetIssueStatuses();
  };
};
