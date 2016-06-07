// API: http://github.com/steves/node-jira
var url = require('url');
var _ = require('lodash');
var JiraApi = require('jira').JiraApi;
var starflow = require('../starflow');

var baseUrl = starflow.config.get('JIRA_URL');
var user = starflow.config.get('JIRA_USERNAME');
var pass = starflow.config.get('JIRA_PASSWORD');
var urlParts = url.parse(baseUrl);
var protocol = _.trimRight(urlParts.protocol, ':');

if (_.isEmpty(user) && urlParts.auth) {
  user = _.get(urlParts.auth.split(':'), 0);
  pass = _.get(urlParts.auth.split(':'), 1);
}

var jiraService = new JiraApi(protocol, urlParts.host, urlParts.port, user, pass, 2);

module.exports = jiraService;
