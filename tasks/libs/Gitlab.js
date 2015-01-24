module.exports = (function (_, Q, common) {
  'use strict';

  var Gitlab = {};

  Gitlab.setApiInstance = function GitlabSetApiInstance(input) {
    var deferred = Q.defer();
    var _name = 'Gitlab.setApiInstance';
    common.logStart(_name, input.logDepth);

    var GitApi = require('gitlab');
    try {
      var api = GitApi({
        url: input.gitlab.protocol + '://' + input.gitlab.host,
        token: input.gitlab.token
      });
      api.isShared = true;
      common.triggerSuccess(input, {
        gitlab: {
          api: api
        }
      }, deferred, input.logDepth);
    }
    catch (err) {
      common.triggerError(err, deferred, input.logDepth);
    }
    return deferred.promise;
  };

  function _isErrorResponse(res) {
    return _.isString(res) && parseInt(res.substr(0, 3), 10) >= 400;
  }

  Gitlab.getProject = function GitlabGetProject(input, projectName) {
    var deferred = Q.defer();
    projectName = projectName || input.gitlab.projectName;
    var _name = 'Gitlab.getProject';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(projectName)) {
      common.triggerError('Need the Gitlab project name', deferred, input.logDepth);
      return deferred.promise;
    }

    input.gitlab.api.projects.all(function (data) {
      if (_isErrorResponse(data)) {
        common.triggerError(data, deferred, input.logDepth);
      }
      else {
        var project; var i = 0;
        while (i < data.length && _.isUndefinedOrNull(project)) {
          if (data[i].name === projectName) {
            project = data[i];
          }
          i++;
        }
        if (_.isDefinedNotNull(project)) {
          common.log('Gitlab project found (id: ' + project.id + ')');
          common.triggerSuccess(input, {
            gitlab: {
              project: project
            }
          }, deferred, input.logDepth);
        }
        else {
          common.triggerError('Gitlab project with name ' + projectName + ' not found', deferred, input.logDepth);
        }
      }
    });

    return deferred.promise;
  };
  Gitlab.getProject.requires = ['setGitlabApiInstance'];

  Gitlab.createMergeRequest = function GitlabCreateMergeRequest(input, sourceBranch, targetBranch) {
    var deferred = Q.defer();
    var mrTitle = '';
    sourceBranch = sourceBranch || input.git.currentBranch;
    targetBranch = targetBranch || 'master';
    var _name = 'Gitlab.createMergeRequest(' + sourceBranch + ', ' + targetBranch + ')';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(input.gitlab.project.id)) {
      common.triggerError('Gitlab project ID is mandatory to do a Merge Request', deferred, input.logDepth);
      return deferred.promise;
    }

    if (_.isUndefinedOrNull(sourceBranch)) {
      common.triggerError('Source branch not provided, could not create the Merge Request', deferred, input.logDepth);
      return deferred.promise;
    }

    var getDevBranchInfo;
    input.logDepth++;
    if (_.isDefinedNotNull(input.jira.issue)) {
      getDevBranchInfo = common.getPromiseForStep({ getDevBranchName: [] }, input);
    }
    else {
      getDevBranchInfo = function () { return Q.when(input); };
    }
    input.logDepth--;

    getDevBranchInfo()
      .then(function (data) {
        if (_.isDefinedNotNull(data.dev)) {
          mrTitle = data.dev.issueType + '(' + data.dev.issueKey + '): ' + input.jira.issue.fields.summary;
        }
        else {
          mrTitle = sourceBranch + ' -> ' + targetBranch;
        }
        input.gitlab.api.projects.merge_requests.add(input.gitlab.project.id, sourceBranch, targetBranch, null, mrTitle, function (data) {
          if (_isErrorResponse(data)) {
            common.triggerError(data, deferred, input.logDepth);
          }
          else {
            if (data === true) {
              common.log(('Merge request "' + mrTitle + '" already exists').yellow, input.logDepth);
            }
            else {
              common.log('Merge request created between ' + sourceBranch + ' and ' + targetBranch, input.logDepth);
            }
            common.triggerSuccess(input, {
              gitlab: {
                mr: data
              }
            }, deferred, input.logDepth);
          }
        });
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Gitlab.createMergeRequest.requires = ['getGitlabProject', 'getCurrentBranch'];

  Gitlab.getMergeRequestBetween = function GitlabGetMergeRequestBetween(input, sourceBranch, targetBranch) {
    var deferred = Q.defer();
    sourceBranch = sourceBranch || input.git.currentBranch;
    targetBranch = targetBranch || 'master';
    var _name = 'Gitlab.getMergeRequestBetween(' + sourceBranch + ', ' + targetBranch + ')';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(input.gitlab.project.id)) {
      common.triggerError('Gitlab project ID is required', deferred, input.logDepth);
    }

    input.gitlab.api.projects.merge_requests.list(input.gitlab.project.id, { per_page: 1000, state: 'opened' }, function (data) {
      if (_isErrorResponse(data)) {
        common.triggerError(data, deferred, input.logDepth);
      }
      else {
        var mr; var i = 0;
        while (i < data.length && _.isUndefinedOrNull(mr)) {
          if (data[i].source_branch === sourceBranch) {
            mr = data[i];
          }
          i++;
        }
        if (_.isDefinedNotNull(mr)) {
          common.log('Merge request between ' + sourceBranch + ' and ' + targetBranch + ' found', input.logDepth);
          common.triggerSuccess(input, {
            gitlab: {
              mr: mr
            }
          }, deferred, input.logDepth);
        }
        else {
          common.triggerError('Merge request between ' + sourceBranch + ' and ' + targetBranch + ' not found', deferred, input.logDepth);
        }
      }
    });

    return deferred.promise;
  };
  Gitlab.getMergeRequestBetween.requires = ['getGitlabProject', 'getCurrentBranch'];

  Gitlab.getUserWithUsername = function GitlabGetUserWithUsername(input, username) {
    var deferred = Q.defer();
    var _name = 'Gitlab.getUserWithUsername(' + username + ')';
    common.logStart(_name, input.logDepth);

    input.gitlab.api.users.all({ per_page: 1000 }, function (data) {
      if (_isErrorResponse(data)) {
        common.triggerError(data, deferred, input.logDepth);
      }
      else {
        var user; var i = 0;
        while (i < data.length && _.isUndefinedOrNull(user)) {
          if (data[i].username === username) {
            user = data[i];
          }
          i++;
        }
        if (_.isDefinedNotNull(user)) {
          common.log('User with username ' + username + ' found', input.logDepth);
          common.triggerSuccess(input, {
            gitlab: {
              lastUser: user
            }
          }, deferred, input.logDepth);
        }
        else {
          common.triggerError('User with username ' + username + ' not found', deferred, input.logDepth);
        }
      }
    });

    return deferred.promise;
  };
  Gitlab.getUserWithUsername.requires = ['setGitlabApiInstance'];

  Gitlab.assignMergeRequest = function GitlabAssignMergeRequest(input, username, sourceBranch, targetBranch) {
    var deferred = Q.defer();
    sourceBranch = sourceBranch || input.git.lastBranchCreated || input.git.currentBranch;
    targetBranch = targetBranch || 'master';
    var _name = 'Gitlab.assignMergeRequest(' + username + ')';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(input.gitlab.project.id)) {
      common.triggerError('Gitlab project ID is mandatory to do a Merge Request', deferred, input.logDepth);
      return deferred.promise;
    }

    if (_.isUndefinedOrNull(sourceBranch)) {
      common.triggerError('Source branch not provided, could not find the Merge Request', deferred, input.logDepth);
      return deferred.promise;
    }

    input.logDepth++;
    var clonedInput = _.cloneDeep(input);
    var getUser = { getGitlabUser: [username] };
    var getMergeRequest = { getMergeRequestBetween: [sourceBranch, targetBranch] };
    clonedInput.steps = [getUser, getMergeRequest];
    var promisesSequence = common.runPromisesSequence(clonedInput, false); // false -> with no control of "requires" attr to avoid double "setGitlabApiInstance"
    input.logDepth--;

    promisesSequence
      .then(function (res) {
        var user = res.gitlab.lastUser;
        var mr = res.gitlab.mr;

        input.gitlab.api.projects.merge_requests.update(input.gitlab.project.id, mr.id, { assignee_id: user.id }, function (data) {
          if (_isErrorResponse(data)) {
            common.triggerError(data, deferred, input.logDepth);
          }
          else {
            common.log('Merge Request "' + mr.title + '" successfully assigned to ' + user.username, input.logDepth);
            common.triggerSuccess(input, {
              gitlab: {
                user: user,
                mr: mr
              }
            }, deferred, input.logDepth);
          }
        });
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Gitlab.assignMergeRequest.requires = ['getGitlabProject', 'getCurrentBranch'];

  return Gitlab;
})(require('lodash'), require('q'), require('./Common'));