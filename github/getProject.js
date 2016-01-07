var _ = require('lodash');
var Promise = require("bluebird");
var starflow = require('../starflow');

function GetProject(api) {
  this.api = api;
}

GetProject.prototype.getProject = function getProject(username, projectName) {
  var githubGetProject = Promise.promisify(this.api.repos.get, {context: this.api});
  return githubGetProject({
      user: username,
      repo: projectName
    })
    .then(onSuccess, onError);

  function onSuccess(project) {
    starflow.logger.success('GITHUB project "' + project.full_name + '" found - ☆('+ project.stargazers_count +')');
    _.set(starflow.config, 'github.project', project);
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

module.exports = function (api) {
  return function () {
    return new GetProject(api);
  };
};
