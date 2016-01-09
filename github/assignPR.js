var _ = require('lodash');
var Promise = require("bluebird");
var starflow = require('../starflow');

function AssignPR(api) {
  this.api = api;
}

AssignPR.prototype.assignPR = function assignPR(username, projectName, assignee, prNumber) {
  var githubAssignPr = Promise.promisify(this.api.issues.edit, {context: this.api});
  return githubAssignPr({
      user: username,
      repo: projectName,
      assignee: assignee,
      number: prNumber
    })
    .then(onSuccess.bind(this), onError);

  function onSuccess() {
    starflow.logger.success('Pull-request successfully assigned to ' + assignee);
    // there is not the base and head objects in the issue received from api.issues.edit, so we need to get the PR
    return Promise.promisify(this.api.pullRequests.get, {context: this.api})({
        user: username,
        repo: projectName,
        number: prNumber
      })
      .then(function (pr) {
        var sourceBranch = pr.base.ref;
        var targetBranch = pr.head.ref;
        var githubPrMap = _.get(starflow.config, 'github.pr', {});
        var prKey = username + '/' + projectName + ' ' + sourceBranch + ':' + targetBranch; // e.g. me/my-project master:my-dev
        githubPrMap[prKey] = pr;
        _.set(starflow.config, 'github.pr', githubPrMap);
      });
  }

  function onError(err) {
    starflow.logger.error('GITHUB project "' + projectName + '" was not found with ' + username + ' user');
    throw err;
  }

};

AssignPR.prototype.exec = function exec(username, projectName, assignee, prNumber) {
  if (_.isEmpty(username)) {
    throw new Error('Username/Organisation is required to assign someone on a GITHUB PR');
  }
  if (_.isEmpty(projectName)) {
    throw new Error('Project name is required to assign someone on a GITHUB PR');
  }
  if (!_.isString(assignee)) {
    throw new Error('A GITHUB PR must have a valid assignee (emptyString or GITHUB user)');
  }
  if (_.isEmpty(prNumber)) {
    throw new Error('A GITHUB PR must be targeted by his PR Number');
  }

  return this.assignPR(username, projectName, assignee, prNumber);
};

module.exports = function (api) {
  return function () {
    return new AssignPR(api);
  };
};
