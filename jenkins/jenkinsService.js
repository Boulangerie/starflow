// API: https://github.com/silas/node-jenkins
var JenkinsApi = require('jenkins');
var starflow = require('../starflow');

var token = new Buffer(starflow.config.get('JENKINS_USERNAME') + ':' + starflow.config.get('JENKINS_PASSWORD'));
var jenkinsService = new JenkinsApi({
  baseUrl: starflow.config.get('JENKINS_URL'),
  headers: {
    'Authorization': 'Basic ' + token.toString('base64')
  },
  promisify: true
});

module.exports = jenkinsService;
