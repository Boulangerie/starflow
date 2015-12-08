module.exports = function jiraFactory(protocol, host, port, user, pass) {
  var JiraApi = require('jira').JiraApi;
  try {
    var api = new JiraApi(protocol, host, port || null, user, pass, 2);
  }
  catch (err) {
    throw err;
  }

  return {
    getIssue: require('./getIssue')(api)
  };
};
