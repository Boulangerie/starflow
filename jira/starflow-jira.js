var url = require('url');
var _ = require('lodash');

module.exports = function jiraFactory(baseUrl, user, pass) {
  var JiraApi = require('jira').JiraApi;
  var urlParts = url.parse(baseUrl);
  var protocol = _.trimRight(urlParts.protocol, ':');
  if (_.isEmpty(user) && urlParts.auth) {
    user = _.get(urlParts.auth.split(':'), 0);
    pass = _.get(urlParts.auth.split(':'), 1);
  }
  try {
    var api = new JiraApi(protocol, urlParts.host, urlParts.port, user, pass, 2);
  }
  catch (err) {
    throw err;
  }

  return {
    api: api,
    assignIssue: require('./assignIssue')(api),
    changeIssueStatus: require('./changeIssueStatus')(api),
    getIssue: require('./getIssue')(api),
    getIssueStatuses: require('./getIssueStatuses')(api)
  };
};
