module.exports = (function (_, Q, BaseTask, Logger) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    getDependencies: function getDependencies(flow, assignee, key) {
      var deps = [];
      if (_.isUndefined(flow.jira.api)) {
        deps.push('jira.setApiInstance');
      }
      return deps;
    },

    fn: function jiraAssignIssue(flow, assignee, key) {
      var deferred = Q.defer();

      if (_.isUndefinedOrNull(assignee)) {
        deferred.reject('No assignee username provided');
        return deferred.promise;
      }

      if (_.isUndefinedOrNull(key)) {
        deferred.reject('No issue key provided');
        return deferred.promise;
      }

      var params = {
        fields: {
          assignee: {
            name: assignee
          }
        }
      }
      Q.ninvoke(flow.jira.api, 'updateIssue', key, params)
        .then(function (data) {
          if (data === 'Success') {
            Logger.log('JIRA issue ' + key + ' was assigned to ' + assignee, 'green');
            deferred.resolve(flow);
          }
          else {
            deferred.reject('There was a problem with the request. Args: ' + key + ', ' + assignee);
          }
        }, function (err) {
          Logger.log('JIRA issue ' + key + ' could not be assigned to ' + assignee + ' (wrong username?)', 'red');
          deferred.reject(err);
        })
        .done();

      return deferred.promise;
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'));
