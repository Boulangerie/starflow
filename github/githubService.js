// API: http://github.com/mikedeboer/node-github
var GithubApi = require('github');
var starflow = require('../starflow');

function GithubService() {
  GithubApi.call(this, { version: '3.0.0' });
  this.authenticate({
    type: 'oauth',
    token: starflow.config.get('GITHUB_TOKEN')
  });
}

GithubService._instance = null;

GithubService.getInstance = function () {
  if (!GithubService._instance) {
    GithubService._instance = new GithubService();
  }
  return GithubService._instance;
};

GithubService.prototype = Object.create(GithubApi.prototype);

module.exports = GithubService;
