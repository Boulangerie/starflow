module.exports = (function (_, Q, BaseTask, Logger, Common) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    getDependencies: function getDependencies(flow, key) {
      var deps = [];
      if (_.isUndefined(flow.jira.api)) {
        deps.push('jira.setApiInstance');
      }
      return deps;
    },

    fn: function jiraGetIssue(flow, key) {
      if (_.isEmpty(key)) {
        Common.throwMandatory('JIRA issue key', key, this);
      }

      return Q.ninvoke(flow.jira.api, 'findIssue', key)
        .then(function (issue) {
          Logger.log('JIRA issue "' + key + '" was found', 'green');
          Logger.log('<'+issue.fields.issuetype.name+'> '+issue.fields.summary+' (assigned to '+((!_.isNull(issue.fields.assignee)) ? issue.fields.assignee.name : 'nobody')+', status: ' + issue.fields.status.name + ')');
          return Q(_.merge(flow, {
            jira: {
              issue: issue
            }
          }));
        }, function (err) {
          Logger.log('JIRA issue "' + key + '" was not found', 'red');
          throw err;
        });
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'), libRequire('Common'));