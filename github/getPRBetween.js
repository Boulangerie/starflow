var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');

function GetPRBetween(api) {
  this.api = api;
}

//@todo: check head construction fit to our needs
//Doc for head construction : https://developer.github.com/v3/pulls/#list-pull-requests
GetPRBetween.prototype.getPRBetween = function getPRBetween(username, projectName, sourceBranch, targetBranch) {
  return Q
    .ninvoke(this.api.pullRequests, 'getAll', {
      user: username,
      repo: projectName,
      base: sourceBranch,
      head: (username + ':'+ targetBranch),
      state: 'open'
    })
    .then(onSuccess, onError);

  function onSuccess(pr) {
    if(_.isUndefined(pr[0])){
      onError('No PR founded');
    }
    else{
      starflow.logger.success('GITHUB PR "' + username + '/' + projectName + ' ' + sourceBranch + ':' + targetBranch + '" found (PR number: ' + pr[0].number + ')');
      //console.log(JSON.stringify(pr[0], ' ', 2));
      _.set(starflow.config, 'github.getPRBetween', pr[0]);
    }
  }

  function onError(err) {
    starflow.logger.error('GITHUB PR between('+sourceBranch+' ... '+targetBranch+') " on ' + projectName + '" was not found with ' + username + ' user');
    throw err;
  }

};

GetPRBetween.prototype.exec = function exec(username, projectName, sourceBranch, targetBranch) {
  if (_.isEmpty(username)) {
    throw new Error('Username/Organisation is required to get a Github PR between two branches');
  }
  if (_.isEmpty(projectName)) {
    throw new Error('Project name is required a Github PR between two branches');
  }
  if (_.isEmpty(sourceBranch)) {
    throw new Error('Source Branch is required a Github PR between two branches');
  }
  if (_.isEmpty(targetBranch)) {
    throw new Error('Target Branch is required a Github PR between two branches');
  }

  return this.getPRBetween(username, projectName, sourceBranch, targetBranch);
};

module.exports = function (api) {
  return function () {
    return new GetPRBetween(api);
  };
};
