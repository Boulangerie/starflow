var _ = require('lodash');
var Promise = require("bluebird");
var starflow = require('../starflow');

function GetIssue(api) {
  this.api = api;
}

GetIssue.prototype.getIssue = function getIssue(key) {
  function onSuccess(issue) {
    starflow.logger.success('JIRA issue "' + key + '" was found');
    starflow.logger.log('<' + issue.fields.issuetype.name + '> ' + issue.fields.summary + ' (assigned to ' + ((!_.isNull(issue.fields.assignee)) ? issue.fields.assignee.name : 'nobody') + ', status: ' + issue.fields.status.name + ')');
    _.set(starflow.config, 'jira.issue', issue);
  }

  function onError(err) {
    starflow.logger.error('JIRA issue "' + key + '" was not found');
    throw err;
  }
  var jiraFindIssue = Promise.promisify(this.api.findIssue);
  return jiraFindIssue(key)
    .then(onSuccess, onError);
};

GetIssue.prototype.openJiraLink = function openJiraLink(key) {
  var spawnFactory = require('../shell/spawn');
  var url = this.api.protocol + '://' + this.api.host + '/browse/' + key;
  var taskConfig = {args: ['open', [url]]};
  return starflow.wrapTask(spawnFactory, taskConfig)();
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
  return function () {
    return new GetIssue(api);
  };
};
