module.exports = (function (_, Q, BaseTask, Logger) {
  'use strict';

  function _checkValues(username, projectname, title, prNumber) {
    if (_.allUndefinedOrNull(assignee, username, projectname, prNumber)) {
      throw new Error('Required: assignee\'s username, username (project owner), project name and PR number');
    }
  }

  return _.extend(_.create(BaseTask), {
    getDependencies: function getDependencies(flow, assignee, userName, projectName, prNumber) {
      var deps = [];
      if (_.isUndefined(flow.github.api)) {
        deps.push('github.setApiInstance');
      }
      return deps;
    },

    fn: function githubAssignPullRequest(flow, assignee, userName, projectName, prNumber) {
      _checkValues(assignee, userName, projectName, prNumber);
      var params = {
        assignee: assignee,
        user: userName,
        repo: projectName,
        number: prNumber
      };
      return Q.ninvoke(flow.github.api.issues, 'edit', params)
        .then(function (pr) {
          Logger.log('Pull request successfully assigned to ' + assignee, 'green');
          return Q(_.merge(flow, {
            github: {
              pr: pr
            }
          }));
        });
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'));
