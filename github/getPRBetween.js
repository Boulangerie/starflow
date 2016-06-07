var _ = require('lodash');
var Promise = require('bluebird');
var githubService = require('./githubService');
var starflow = require('../starflow');
var BaseExecutable = require('../Executable');

function GetPRBetween() {
  BaseExecutable.call(this, 'github.getPRBetween');
}
GetPRBetween.prototype = Object.create(BaseExecutable.prototype);
GetPRBetween.prototype.constructor = GetPRBetween;

// @todo: check if head construction fits to our needs
// Doc for head construction: https://developer.github.com/v3/pulls/#list-pull-requests
GetPRBetween.prototype.getPRBetween = function getPRBetween(username, projectName, sourceBranch, targetBranch) {
  var githubGetPRBetween = Promise.promisify(githubService.pullRequests.getAll, {context: githubService});
  var prKey = username + '/' + projectName + ' ' + sourceBranch + ':' + targetBranch; // e.g. me/my-project master:my-dev

  return githubGetPRBetween({
      user: username,
      repo: projectName,
      base: sourceBranch,
      head: (username + ':'+ targetBranch),
      state: 'open'
    })
    .then(onSuccess.bind(this));

  function onSuccess(pr) {
    if (_.isUndefined(pr[0])) {
      onError('No PR found for "' + prKey + '"');
    } else {
      starflow.logger.success('Github PR "' + prKey + '" found (PR number: ' + pr[0].number + ')');
      this.storage.set('pr', pr);
    }
  }

};

GetPRBetween.prototype.exec = function exec(username, projectName, sourceBranch, targetBranch) {
  if (_.isEmpty(username)) {
    throw new Error('Username/Organization is required to get a Github PR between two branches');
  }
  if (_.isEmpty(projectName)) {
    throw new Error('Project name is required to get a Github PR between two branches');
  }
  if (_.isEmpty(sourceBranch)) {
    throw new Error('Source Branch is required to get a Github PR between two branches');
  }
  if (_.isEmpty(targetBranch)) {
    throw new Error('Target Branch is required to get a Github PR between two branches');
  }

  return this.getPRBetween(username, projectName, sourceBranch, targetBranch);
};

module.exports = function () {
  return new GetPRBetween();
};
