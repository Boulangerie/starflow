module.exports = (function (_, Q, BaseTask, Logger, Common) {
  'use strict';

  function _checkValues(protocol, host, user, pass) {
    if (_.allUndefinedOrNull(protocol, host, user, pass)) {
      throw new Error('Required: jira.protocol, jira.host, jira.user, jira.pass');
    }
  }

  return _.extend(_.create(BaseTask), {
    fn: function jiraSetApiInstance(flow) {
      _checkValues(flow.jira.protocol, flow.jira.host, flow.jira.user, flow.jira.pass);
      var JiraApi = require('jira').JiraApi;
      try {
        var api = new JiraApi(flow.jira.protocol, flow.jira.host, flow.jira.port || null, flow.jira.user, flow.jira.pass, 2);
      }
      catch (err) {
        throw err;
      }

      api.isShared = true;
      return Q(_.merge(flow, {
        jira: {
          api: api
        }
      }));
    }
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'), libRequire('Common'));