module.exports = function jiraFactory(protocol, host, port, user, pass) {
  var JiraApi = require('jira').JiraApi;
  try {
    var api = new JiraApi(protocol, host, port || null, user, pass, 2);
  }
  catch (err) {
    throw err;
  }

  return {
    assignIssue: require('./assignIssue')(api),
    changeIssueStatus: require('./changeIssueStatus')(api),
    getIssue: require('./getIssue')(api),
    getIssueStatuses: require('./getIssueStatuses')(api)
  };
};
