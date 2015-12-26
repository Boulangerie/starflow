var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');

function GetIssueStatuses(api) {
  this.api = api;
}

GetIssueStatuses.prototype.getIssueStatuses = function getIssueStatuses(key) {
  function onSuccess(issue) {
    starflow.logger.success('JIRA issue statuses"' + key + '" were found');
    starflow.logger.log('Statuses : ' + _.map(issue.transitions, function (status) { return status.to.name; }).join(', '));
    _.set(starflow.config, 'jira.getIssueStatuses', issue.transitions);
  }

  function onError(err) {
    starflow.logger.error('JIRA issue "' + key + '" was not found');
    throw err;
  }

  return Q.ninvoke(this.api, 'listTransitions', key)
    .then(onSuccess, onError);
};

GetIssueStatuses.prototype.exec = function exec(key) {
  if (_.isEmpty(key)) {
    throw new Error('JIRA issue key is required');
  }
  return this.getIssueStatuses(key);
};

module.exports = function (api) {
  return function () {
    return new GetIssueStatuses(api);
  };
};
