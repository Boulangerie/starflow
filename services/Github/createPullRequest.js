module.exports = (function (_, Q, BaseTask, Logger) {
  'use strict';

  function _checkValues(username, projectname, title, source, target) {
    if (_.allUndefinedOrNull(username, projectname, title, source, target)) {
      throw new Error('Required: username (project owner), project name, PR title, head branch name (e.g. my-dev), base branch name (e.g. master)');
    }
  }

  return _.extend(_.create(BaseTask), {
    logHeader: function logHeader(args) {
      var flow = args[0];
      var pr = {
        user: args[1],
        repo: args[2],
        title: args[3],
        base: args[4],
        head: args[5]
      };
      return 'Create a pull request "' + pr.title + '" on ' + pr.user + '/' + pr.repo + ' between branches ' + pr.base + ' and ' + pr.head;
    },

    getDependencies: function getDependencies(flow, userName, projectName, title, headBranch, baseBranch) {
      var deps = [];
      if (_.isUndefined(flow.github.api)) {
        deps.push('github.setApiInstance');
      }
      return deps;
    },

    fn: function githubCreatePullRequest(flow, userName, projectName, title, headBranch, baseBranch) {
      _checkValues(userName, projectName, title, headBranch, baseBranch);
      var params = {
        user: userName,
        repo: projectName,
        title: title,
        base: baseBranch,
        head: headBranch
      };
      return Q.ninvoke(flow.github.api.pullRequests, 'create', params)
        .then(function (pr) {
          Logger.log('Pull request successfully created: ' + pr.html_url, 'green');
          return Q(_.merge(flow, {
            github: {
              pr: pr
            }
          }));
        }, function (err) {
          if (/already exists/.test(err.message)) {
            Logger.log('Pull request already exists', 'yellow');
            return Q(flow);
          } else {
            Logger.log('Could not create the pull request', 'red');
            throw err;
          }
        });
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'));
