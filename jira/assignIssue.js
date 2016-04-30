var _ = require('lodash');
var Promise = require('bluebird');
var starflow = require('../starflow');
var BaseExecutable = require('../Executable');

function AssignIssue(api) {
  BaseExecutable.call(this, 'jira.assignIssue');
  this.api = api;
  this.nonUserMapping = {
    'unassigned' : '',
    'automatic' : '-1'
  };
}
AssignIssue.prototype = Object.create(BaseExecutable.prototype);
AssignIssue.prototype.constructor = AssignIssue;

// According to: https://confluence.atlassian.com/display/JIRAKB/How+to+Set+Assignee+to+Unassigned+via+REST+API+in+JIRA
AssignIssue.prototype.mapNonUserAssignee = function mapNonUserAssignee(assignee) {
  return _.get(this.nonUserMapping, assignee, assignee);
};

AssignIssue.prototype.assignIssue = function assignIssue(key, assignee) {
  var params = _.set({}, 'fields.assignee.name', this.mapNonUserAssignee(assignee));
  var jiraAssignIssue = Promise.promisify(this.api.updateIssue, {context: this.api});

  return jiraAssignIssue(key, params)
    .then(onSuccess.bind(this), onError);


  function onSuccess(response) {
    if (response === 'Success') {
      starflow.logger.success('JIRA issue ' + key + ' was assigned to ' + assignee);
      this.storage.set('assignee', assignee);
    } else {
      starflow.logger.error('There was a problem with the request. Args: ' + [key, assignee].join(', '));
      throw response;
    }
  }

  function onError(err) {
    starflow.logger.error('JIRA issue ' + key + ' could not be assigned to ' + assignee + ' (wrong username?)');
    throw err;
  }
};

AssignIssue.prototype.exec = function exec(key, assignee) {
  if (_.isEmpty(key)) {
    throw new Error('JIRA issue key is required');
  }

  if (_.isEmpty(assignee)) {
    throw new Error('An assignee is required');
  }

  return this.assignIssue(key, assignee);
};

module.exports = function (api) {
  return function () {
    return new AssignIssue(api);
  };
};
