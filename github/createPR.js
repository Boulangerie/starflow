var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');

function CreatePR(api) {
  this.api = api;
}

CreatePR.prototype.createPR = function createPR(username, projectName, sourceBranch, targetBranch, title) {
  return Q
    .ninvoke(this.api.pullRequests, 'create', {
      user: username,
      repo: projectName,
      base: sourceBranch,
      head: (username + ':'+ targetBranch),
      title: title
    })
    .then(onSuccess, onError);

  function onSuccess(pr) {
    starflow.logger.success('Pull request successfully created: ' + pr.html_url);
    _.set(starflow.config, 'github.createPR', pr);
  }

  function onError(err) {
    if (/already exists/.test(err.message)) {
      starflow.logger.log('Pull request already exists');
    }
    else {
      starflow.logger.error.log('Could not create the pull request');
      throw err;
    }
  }

};

CreatePR.prototype.exec = function exec(username, projectName, sourceBranch, targetBranch, title) {
  if (_.isEmpty(username)) {
    throw new Error('Username/Organisation is required to create a GITHUB PR');
  }
  if (_.isEmpty(projectName)) {
    throw new Error('Project name is required to create a GITHUB PR');
  }
  if (!_.isString(sourceBranch)) {
    throw new Error('A source branch (BASE) is required to create a GITHUB PR');
  }
  if (_.isEmpty(targetBranch)) {
    throw new Error('A target branch (HEAD) is required to create a GITHUB PR');
  }
  if (_.isEmpty(title)) {
    throw new Error('A title is required to create a GITHUB PR');
  }

  return this.createPR(username, projectName, sourceBranch, targetBranch, title);
};

module.exports = function (api) {
  return function () {
    return new CreatePR(api);
  };
};
