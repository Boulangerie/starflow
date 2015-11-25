module.exports = (function (_, Q, BaseTask, Logger, Common) {
  'use strict';

  function _checkArgs(status, key) {
    if (_.isUndefinedOrNull(status)) {
      throw new Error('No issue status provided');
    }

    if (_.isUndefinedOrNull(key)) {
      throw new Error('No issue key provided');
    }
  }

  function _getStatusPayload(flow, statusName, key) {
    var task = { name: 'jira.getIssueStatuses', args: [key] };
    return Common.taskWrapper(task, flow)()
      .then(function (res) {
        var issueTransition;
        _.forEach(res.jira.availableStatuses, function (status) {
          if (status.to.name === statusName) {
            issueTransition = {
              transition: status
            };
          }
        });
        if (!_.isUndefinedOrNull(issueTransition)) {
          return Q(issueTransition);
        } else {
          throw new Error('Issue status "' + statusName + '" could not be found for issue "' + key + '"')
        }
      });
  }

  function _updateIssueStatus(flow, status, key) {
    return Q.ninvoke(flow.jira.api, 'transitionIssue', key, status)
      .then(function (data) {
        Logger.log('Jira issue ' + key + ' has now the status "' + status.transition.name + '"');
        return Q(_.merge(flow, {
          jira: {
            lastStatus: status
          }
        }));
      });
  }

  return _.extend(_.create(BaseTask), {
    getDependencies: function getDependencies(flow, status, key) {
      var deps = [];
      if (_.isUndefined(flow.jira.api)) {
        deps.push('jira.setApiInstance');
      }
      return deps;
    },

    fn: function jiraChangeIssueStatus(flow, status, key) {
      _checkArgs(status, key);
      return _getStatusPayload(flow, status, key)
        .then(function (issueTransition) {
          return _updateIssueStatus(flow, issueTransition, key);
        });
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'), libRequire('Common'));
