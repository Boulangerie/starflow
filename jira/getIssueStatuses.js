var _ = require('lodash');
var Promise = require('bluebird');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function GetIssueStatuses(parentNamespace, api) {
  BaseExecutable.call(this, 'jira.getIssueStatuses', parentNamespace);
  this.api = api;
}
GetIssueStatuses.prototype = Object.create(BaseExecutable.prototype);
GetIssueStatuses.prototype.constructor = GetIssueStatuses;

GetIssueStatuses.prototype.getIssueStatuses = function getIssueStatuses(key) {
  var jiraGetIssueStatuses = Promise.promisify(this.api.listTransitions, {context: this.api});
  return jiraGetIssueStatuses(key)
    .then(onSuccess.bind(this), onError);

  function onSuccess(issue) {
    starflow.logger.success('JIRA issue statuses"' + key + '" were found');
    var statuses = _.map(issue.transitions, function (status) { return status.to.name; }).join(', ');
    starflow.logger.log('Statuses: ' + statuses);
    this.storage.set('issueStatuses', issue.transitions);
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

module.exports = function (api) {
  return function (parentNamespace) {
    return new GetIssueStatuses(parentNamespace, api);
  };
};
