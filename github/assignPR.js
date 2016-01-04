var _ = require('lodash');
var Q = require('q');
var starflow = require('../starflow');

function AssignPR(api) {
  this.api = api;
}
//none
AssignPR.prototype.assignPR = function assignPR(username, projectName, assignee, PRNumber) {
  return Q
    .ninvoke(this.api.issues, 'edit', {
      user: username,
      repo: projectName,
      assignee: assignee,
      number: PRNumber
    })
    .then(onSuccess, onError);

  function onSuccess(pr) {
    starflow.logger.success('Pull request successfully assigned to ' + assignee);
    _.set(starflow.config, 'github.assignPR', pr);
  }

  function onError(err) {
    starflow.logger.error('GITHUB project "' + projectName + '" was not found with ' + username + ' user');
    throw err;
  }

};

AssignPR.prototype.exec = function exec(username, projectName, assignee, PRNumber) {
  if (_.isEmpty(username)) {
    throw new Error('Username/Organisation is required to assign someone on a GITHUB PR');
  }
  if (_.isEmpty(projectName)) {
    throw new Error('Project name is required to assign someone on a GITHUB PR');
  }
  if (!_.isString(assignee)) {
    throw new Error('A GITHUB PR must have a valid assignee (emptyString or GITHUB user)');
  }
  if (_.isEmpty(PRNumber)) {
    throw new Error('A GITHUB PR must be targeted by his PR Number');
  }

  return this.assignPR(username, projectName, assignee, PRNumber);
};

module.exports = function (api) {
  return function () {
    return new AssignPR(api);
  };
};
