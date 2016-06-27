var _ = require('lodash');
var Promise = require('bluebird');
var jiraService = require('./jiraService');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function GetIssueStatuses() {
  BaseExecutable.call(this, 'jira.getIssueStatuses');
}
GetIssueStatuses.prototype = Object.create(BaseExecutable.prototype);
GetIssueStatuses.prototype.constructor = GetIssueStatuses;

GetIssueStatuses.prototype.getIssueStatuses = function getIssueStatuses(issue) {
  var jiraGetIssueStatuses = Promise.promisify(jiraService.listTransitions, {context: jiraService});
  var key = issue.key;

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

GetIssueStatuses.prototype.exec = function exec(issue) {
  if (!_.isObject(issue)) {
    throw new Error('issue parameter must be an object (got ' + issue + ')');
  }
  return this.getIssueStatuses(issue);
};

module.exports = function () {
  return new GetIssueStatuses();
};
