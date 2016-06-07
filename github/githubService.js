// API: http://github.com/mikedeboer/node-github
var GithubApi = require('github');
var starflow = require('../starflow');

var githubService = new GithubApi({version: '3.0.0'});
githubService.authenticate({
  type: 'oauth',
  token: starflow.config.get('GITHUB_TOKEN')
});

module.exports = githubService;
