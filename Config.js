var _ = require('lodash');
var rc = require('rc');

var DEFAULT_CONFIG = {
  JENKINS_USERNAME: null,
  JENKINS_PASSWORD: null,
  JIRA_USERNAME: null,
  JIRA_PASSWORD: null,
  GITHUB_CLIENT_ID: null,
  GITHUB_CLIENT_SECRET: null,
  GITHUB_TOKEN: null
};

var Config = function () {
  this.config = rc('starflow', DEFAULT_CONFIG);
};

Config.prototype.get = function (path, defaultValue) {
  return _.get(this.config, path, defaultValue);
};

module.exports = Config;
