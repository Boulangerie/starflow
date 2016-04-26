var _ = require('lodash');
var Promise = require('bluebird');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function CreatePR(parentNamespace, api) {
  BaseExecutable.call(this, 'github.createPR', parentNamespace);
  this.api = api;
}
CreatePR.prototype = Object.create(BaseExecutable.prototype);
CreatePR.prototype.constructor = CreatePR;

CreatePR.prototype.createPR = function createPR(username, projectName, sourceBranch, targetBranch, title) {
  var githubCreatePR = Promise.promisify(this.api.pullRequests.create, {context: this.api});
  var prKey = username + '/' + projectName + ' ' + sourceBranch + ':' + targetBranch; // e.g. me/my-project master:my-dev
  return githubCreatePR({
      user: username,
      repo: projectName,
      base: sourceBranch,
      head: (username + ':'+ targetBranch),
      title: title
    })
    .then(onSuccess.bind(this), onError);

  function onSuccess(pr) {
    starflow.logger.success('Pull-request successfully created: ' + pr.html_url);
    var githubPrMap = this.storage.get('pr', {});
    githubPrMap[prKey] = pr;
    this.storage.set('pr', githubPrMap);
  }

  function onError(err) {
    if (/already exists/.test(err.message)) {
      starflow.logger.warning('Pull-request "' + prKey + '" already exists');
    }
    else {
      starflow.logger.error('Could not create the pull-request');
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
  return function (parentNamespace) {
    return new CreatePR(parentNamespace, api);
  };
};
