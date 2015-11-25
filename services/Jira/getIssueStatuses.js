module.exports = (function (_, Q, BaseTask, Logger) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    getDependencies: function getDependencies(flow, key) {
      var deps = [];
      if (_.isUndefined(flow.jira.api)) {
        deps.push('jira.setApiInstance');
      }
      return deps;
    },

    fn: function jiraGetIssueStatuses(flow, key) {
      if (_.isUndefinedOrNull(key)) {
        throw new Error('No issue key provided');
      }

      return Q.ninvoke(flow.jira.api, 'listTransitions', key)
        .then(function (data) {
          Logger.log('Issue statuses found: ' + _.map(data.transitions, function (status) { return status.to.name; }).join(', '), 'green');
          return Q(_.merge(flow, {
            jira: {
              availableStatuses : data.transitions
            }
          }));
        });
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'));
