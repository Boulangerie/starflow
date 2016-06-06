// API: https://github.com/silas/node-jenkins
var JenkinsApi = require('jenkins');
var starflow = require('../starflow');

function JenkinsService() {
  var token = new Buffer(starflow.config.get('JENKINS_USERNAME') + ':' + starflow.config.get('JENKINS_PASSWORD'));
  JenkinsApi.call(this, {
    baseUrl: starflow.config.get('JENKINS_URL'),
    headers: {
      'Authorization': 'Basic ' + token.toString('base64')
    },
    promisify: true
  });
}

JenkinsService._instance = null;

JenkinsService.getInstance = function () {
  if (!JenkinsService._instance) {
    JenkinsService._instance = new JenkinsService();
  }
  return JenkinsService._instance;
};

JenkinsService.prototype = Object.create(JenkinsApi.prototype);

module.exports = JenkinsService;
