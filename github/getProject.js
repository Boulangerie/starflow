var _ = require('lodash');
var Promise = require('bluebird');
var githubService = require('./githubService');
var starflow = require('../starflow');
var BaseExecutable = require('../Executable');

function GetProject() {
  BaseExecutable.call(this, 'github.getProject');
}
GetProject.prototype = Object.create(BaseExecutable.prototype);
GetProject.prototype.constructor = GetProject;

GetProject.prototype.getProject = function getProject(username, projectName) {
  var githubGetProject = Promise.promisify(githubService.repos.get, {context: githubService});
  return githubGetProject({
      user: username,
      repo: projectName
    })
    .then(onSuccess.bind(this), onError);

  function onSuccess(project) {
    starflow.logger.success('Github project "' + project.full_name + '" found - (' + project.stargazers_count + ' ☆)');
    this.storage.set('project', project);
  }

  function onError(err) {
    starflow.logger.error('GITHUB project "' + projectName + '" was not found with ' + username + ' user');
    throw err;
  }

};

GetProject.prototype.exec = function exec(username, projectName) {
  if (_.isEmpty(username)) {
    throw new Error('Username/Organisation is required to get a Github project');
  }

  if (_.isEmpty(projectName)) {
    throw new Error('Project name is required to get a Github project');
  }

  return this.getProject(username, projectName);
};

module.exports = function () {
  return function () {
    return new GetProject();
  };
};
