var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');

function AssignIssue(api) {
  this.api = api;
  this.nonUserMapping = {
    'unassigned' : '',
    'automatic' : '-1'
  }
}

//According to : https://confluence.atlassian.com/display/JIRAKB/How+to+Set+Assignee+to+Unassigned+via+REST+API+in+JIRA
AssignIssue.prototype.mapNonUserAssignee = function mapNonUserAssignee(assignee){
  return _.get(this.nonUserMapping, assignee, assignee);
};

AssignIssue.prototype.assignIssue = function assignIssue(key, assignee) {
  var params = _.set({}, 'fields.assignee.name', this.mapNonUserAssignee(assignee));
  return Q
    .ninvoke(this.api, 'updateIssue', key, params)
    .then(onSuccess, onError);


  function onSuccess(response) {
    if(response === 'Success'){
      starflow.logger.success('JIRA issue ' + key + ' was assigned to ' + assignee);
      _.set(starflow.config, 'jira.assignIssue', assignee);
    }
    else{
      starflow.logger.error('There was a problem with the request. Args: ' + key + ', ' + assignee);
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