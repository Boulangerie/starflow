var _ = require('lodash');
var Promise = require('bluebird');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function GetPRBetween(name, parentNamespace, api) {
  BaseExecutable.call(this, name, parentNamespace);
  this.api = api;
}
GetPRBetween.prototype = Object.create(BaseExecutable.prototype);
GetPRBetween.prototype.constructor = GetPRBetween;

//@todo: check head construction fit to our needs
//Doc for head construction : https://developer.github.com/v3/pulls/#list-pull-requests
GetPRBetween.prototype.getPRBetween = function getPRBetween(username, projectName, sourceBranch, targetBranch) {
  var githubGetPRBetween = Promise.promisify(this.api.pullRequests.getAll, {context: this.api});
  return githubGetPRBetween({
      user: username,
      repo: projectName,
      base: sourceBranch,
      head: (username + ':'+ targetBranch),
      state: 'open'
    })
    .then(onSuccess.bind(this), onError);

  function onSuccess(pr) {
    var prKey = username + '/' + projectName + ' ' + sourceBranch + ':' + targetBranch; // e.g. me/my-project master:my-dev
    if (_.isUndefined(pr[0])) {
      onError('No PR found for ' + prKey);
    } else {
      starflow.logger.success('Github PR "' + prKey + '" found (PR number: ' + pr[0].number + ')');
      var githubPrMap = this.storage.get('pr', {});
      githubPrMap[prKey] = pr[0];
      this.storage.set('pr', githubPrMap);
    }
  }

  function onError(err) {
    starflow.logger.error('GITHUB PR between ('+sourceBranch+' ... '+targetBranch+') " on ' + projectName + '" was not found with ' + username + ' user');
    throw err;
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

module.exports = function (api) {
  return function (parentNamespace) {
    return new GetPRBetween('github.getPRBetween', parentNamespace, api);
  };
};
