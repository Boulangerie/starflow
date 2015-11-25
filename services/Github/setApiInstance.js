module.exports = (function (_, Q, BaseTask, Logger, Common) {
  'use strict';

  function _checkValues(token) {
    if (_.isUndefinedOrNull(token)) {
      throw new Error('Required: github.token');
    }
  }

  return _.extend(_.create(BaseTask), {
    fn: function githubSetApiInstance(flow) {
      _checkValues(flow.github.token);
      var GithubApi = require('github');
      try {
        var api = new GithubApi({
          version: '3.0.0'
        });
        api.authenticate({
          type: 'oauth',
          token: flow.github.token
        });
      }
      catch (err) {
        throw err;
      }

      api.isShared = true;
      return Q(_.merge(flow, {
        github: {
          api: api
        }
      }));
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'), libRequire('Common'));