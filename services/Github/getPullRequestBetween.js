module.exports = (function (_, Q, BaseTask, Logger) {
  'use strict';

  function _checkValues(username, projectname, source, target) {
    if (_.allUndefinedOrNull(username, projectname, source, target)) {
      throw new Error('Required: username (project owner), project name, source branch name, target branch name (e.g. master)');
    }
  }

  return _.extend(_.create(BaseTask), {
    getDependencies: function getDependencies(flow, userName, projectName, sourceBranch, targetBranch) {
      var deps = [];
      if (_.isUndefined(flow.github.api)) {
        deps.push('github.setApiInstance');
      }
      return deps;
    },

    fn: function githubGetPullRequestBetween(flow, userName, projectName, sourceBranch, targetBranch) {
      _checkValues(userName, projectName, sourceBranch, targetBranch);
      var params = {
        user: userName,
        repo: projectName,
        base: sourceBranch,
        head: targetBranch,
        state: 'open'
      };
      return Q.ninvoke(input.github.api.pullRequests, 'getAll', params)
        .then(function (pr) {
          common.log('Github pull request "' + userName + '/' + projectName + ' ' + sourceBranch + ':' + targetBranch + '" found (id: ' + pr[0].id + ')');
          return Q(_.merge(flow, {
            github: {
              pr: pr
            }
          }));
        });
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'));
