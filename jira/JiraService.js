// API: http://github.com/steves/node-jira
var url = require('url');
var _ = require('lodash');
var JiraApi = require('jira').JiraApi;
var starflow = require('../starflow');

function JiraService() {
  var baseUrl = starflow.config.get('JIRA_URL');
  var user = starflow.config.get('JIRA_USERNAME');
  var pass = starflow.config.get('JIRA_PASSWORD');
  var urlParts = url.parse(baseUrl);
  var protocol = _.trimRight(urlParts.protocol, ':');
  if (_.isEmpty(user) && urlParts.auth) {
    user = _.get(urlParts.auth.split(':'), 0);
    pass = _.get(urlParts.auth.split(':'), 1);
  }
  try {
    JiraApi.call(this, protocol, urlParts.host, urlParts.port, user, pass, 2);
  }
  catch (err) {
    throw err;
  }
}

JiraService._instance = null;

JiraService.getInstance = function () {
  if (!JiraService._instance) {
    JiraService._instance = new JiraService();
  }
  return JiraService._instance;
};

JiraService.prototype = Object.create(JiraApi.prototype);

module.exports = JiraService;
