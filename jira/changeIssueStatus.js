var _ = require('lodash');
var Promise = require('bluebird');
var jiraService = require('./jiraService');
var starflow = require('../starflow');
var taskGetIssueStatuses = require('./getIssueStatuses');
var Task = require('../Task');
var BaseExecutable = require('../Executable');

function ChangeIssueStatus() {
  BaseExecutable.call(this, 'jira.changeIssueStatus');
}
ChangeIssueStatus.prototype = Object.create(BaseExecutable.prototype);
ChangeIssueStatus.prototype.constructor = ChangeIssueStatus;

ChangeIssueStatus.prototype.getIssueStatuses = function getIssueStatuses(key, status) {
  var executableChild = taskGetIssueStatuses();
  this.addChild(executableChild);
  return new Task(executableChild, [key, status]).run();
};

ChangeIssueStatus.prototype.changeIssueStatus = function changeIssueStatus(key, status) {
  var transition = _.find(starflow.config.jira.getIssueStatuses, _.set({}, 'to.name', status));
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

ChangeIssueStatus.prototype.exec = function exec(key, status) {
  if (_.isEmpty(key)) {
    throw new Error('JIRA issue key is required');
  }
  if (_.isEmpty(status)) {
    throw new Error('JIRA status is required');
  }
  return this
    .getIssueStatuses(key, status)
    .then(function () {
      return this.changeIssueStatus(key, status);
    }.bind(this));
};

module.exports = function () {
  return new ChangeIssueStatus();
};
