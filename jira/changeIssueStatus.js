var _ = require('lodash');
var Promise = require('bluebird');
var jiraService = require('./jiraService');
var starflow = require('../starflow');
var taskGetIssueStatuses = require('./getIssueStatuses');
var Task = require('../Task');
var BaseExecutable = require('../BaseExecutable');

function ChangeIssueStatus() {
  BaseExecutable.call(this, 'jira.changeIssueStatus');
}
ChangeIssueStatus.prototype = Object.create(BaseExecutable.prototype);
ChangeIssueStatus.prototype.constructor = ChangeIssueStatus;

ChangeIssueStatus.prototype.getIssueStatuses = function getIssueStatuses(issue, status) {
  var executableChild = this.createExecutable(taskGetIssueStatuses);
  return new Task(executableChild, [issue, status]).run();
};

ChangeIssueStatus.prototype.changeIssueStatus = function changeIssueStatus(issue, status) {
  var transition = _.find(this.storage.get('jira.getIssueStatuses/statuses'), _.set({}, 'to.name', status));
  var key = issue.key;
  var jiraChangeIssueStatus = Promise.promisify(jiraService.transitionIssue, {context: jiraService});

  if (_.isUndefined(transition)) {
    throw new Error('Issue status "' + status + '" could not be found for issue "' + key + '"');
  }

  return jiraChangeIssueStatus(key, {transition : transition})
    .then(onSuccess.bind(this), onError);

  function onSuccess(response) {
    if (response === 'Success') {
      starflow.logger.success('JIRA issue ' + key + ' has now the status "' + status + '"');
      this.storage.set('status', status);
    }
    else {
      starflow.logger.error('There was a problem with the request. Args: ' + key + ', ' + status);
      throw response;
    }
  }

  function onError(err) {
    starflow.logger.error('JIRA issue ' + key + ' could not pass to ' + status + ' status (wrong/invalid status?)');
    throw err;
  }
};

ChangeIssueStatus.prototype.exec = function exec(issue, status) {
  if (!_.isObject(issue)) {
    throw new Error('issue parameter must be an object (got ' + issue + ')');
  }
  if (_.isEmpty(status)) {
    throw new Error('JIRA status is required');
  }

  return this.getIssueStatuses(issue, status)
    .then(function () {
      return this.changeIssueStatus(issue, status);
    }.bind(this));
};

module.exports = function () {
  return new ChangeIssueStatus();
};
