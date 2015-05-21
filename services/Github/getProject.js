module.exports = (function (_, Q, BaseTask, Logger) {
  'use strict';

  function _checkValues(username, projectname) {
    if (_.allUndefinedOrNull(username, projectname)) {
      throw new Error('Required to get a Github project: username (project owner) and project name');
    }
  }

  return _.extend(_.create(BaseTask), {
    getDependencies: function getDependencies(flow, userName, projectName) {
      var deps = [];
      if (_.isUndefined(flow.github.api)) {
        deps.push('github.setApiInstance');
      }
      return deps;
    },

    fn: function githubGetProject(flow, userName, projectName) {
      _checkValues(userName, projectName);
      var params = {
        user: userName,
        repo: projectName
      };
      return Q.ninvoke(flow.github.api.repos, 'get', params)
        .then(function (project) {
          Logger.log('Github project "' + userName + '/' + projectName + '" found (id: ' + project.id + ')');
          return Q(_.merge(flow, {
            github: {
              project: project
            }
          }));
        });
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'));
