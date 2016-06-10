// API: https://github.com/silas/node-jenkins
var JenkinsApi = require('jenkins');
var _ = require('lodash');
var starflow = require('../starflow');

var url = starflow.config.get('JENKINS_URL');
if (_.isEmpty(url)) {
  throw new Error('Jenkins url is mandatory');
}

var username = starflow.config.get('JENKINS_USERNAME');
var password = starflow.config.get('JENKINS_PASSWORD');

var token = new Buffer(username + ':' + password);
var jenkinsService = new JenkinsApi({
  baseUrl: url,
  headers: {
    'Authorization': 'Basic ' + token.toString('base64')
  },
  promisify: true
});

module.exports = jenkinsService;
