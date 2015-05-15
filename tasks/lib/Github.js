module.exports = (function (_, Q, common) {
  'use strict';

  var Github = {};

  Github.setApiInstance = function githubSetApiInstance(input) {
    var deferred = Q.defer();
    var _name = 'github.setApiInstance';
    common.logStart(_name, input.logDepth);

    var GithubApi = require('github');
    try {
      var api = new GithubApi({
        version: '3.0.0'
      });
      api.authenticate({
        type: 'oauth',
        token: input.github.token
      });
      api.isShared = true;
      common.triggerSuccess(input, {
        github: {
          api: api
        }
      }, deferred, input.logDepth);
    }
    catch (err) {
      common.triggerError(err, deferred, input.logDepth);
    }
    return deferred.promise;
  };

  Github.getProject = function githubGetProject(input, userName, projectName) {
    var deferred = Q.defer();
    userName = userName || input.github.userName;
    projectName = projectName || input.github.projectName;
    common.logStart('Github.getProject', input.logDepth);

    if (_.isUndefinedOrNull(userName)) {
      common.triggerError('Need the Github username of the project owner', deferred, input.logDepth);
      return deferred.promise;
    }

    if (_.isUndefinedOrNull(projectName)) {
      common.triggerError('Need the Github project name', deferred, input.logDepth);
      return deferred.promise;
    }

    var params = {
      user: userName,
      repo: projectName
    };

    Q.ninvoke(input.github.api.repos, 'get', params)
      .then(function (project) {
        common.log('Github project "' + userName + '/' + projectName + '" found (id: ' + project.id + ')', input.logDepth);
        common.triggerSuccess(input, {
          github: {
            project: project
          }
        }, deferred, input.logDepth);
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();
    return deferred.promise;
  };
  Github.getProject.requires = ['setGithubApiInstance'];

  Github.getPullRequestBetween = function githubGetPullRequestBetween(input, userName, projectName, sourceBranch, targetBranch) {
    var deferred = Q.defer();
    sourceBranch = sourceBranch || input.git.currentBranch;
    targetBranch = targetBranch || 'master';
    userName = userName || input.github.project.owner.login;
    projectName = projectName || input.github.project.name;
    var _name = 'Gitlab.getPullRequestBetween(' + userName + ', ' + projectName + ', ' + sourceBranch + ', ' + targetBranch + ')';
    common.logStart(_name, input.logDepth);

    var params = {
      user: userName,
      repo: projectName,
      base: sourceBranch,
      head: targetBranch,
      state: 'open'
    };

    Q.ninvoke(input.github.api.pullRequests, 'getAll', params)
      .then(function (pr) {
        common.log('Github pull request "' + userName + '/' + projectName + ' ' + sourceBranch + ':' + targetBranch + '" found (id: ' + pr[0].id + ')', input.logDepth);
        common.triggerSuccess(input, {
          github: {
            pr: pr[0]
          }
        }, deferred, input.logDepth);
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Github.getPullRequestBetween.requires = ['getGithubProject'];

  Github.createPullRequest = function githubCreatePullRequest(input, userName, projectName, sourceBranch, targetBranch) {
    var deferred = Q.defer();
    sourceBranch = sourceBranch || input.git.currentBranch;
    targetBranch = targetBranch || 'master';
    userName = userName || input.github.project.owner.login;
    projectName = projectName || input.github.project.name;
    var prTitle = '';
    var _name = 'Gitlab.createPullRequest(' + userName + ', ' + projectName + ', ' + sourceBranch + ', ' + targetBranch + ')';
    common.logStart(_name, input.logDepth);

    common.log('Creating pull request on project ' + input.github.project.full_name + '...', input.logDepth);

    if (_.isUndefinedOrNull(input.github.project)) {
      common.triggerError('Github project is mandatory to do a Pull Request', deferred, input.logDepth);
      return deferred.promise;
    }

    if (_.isUndefinedOrNull(sourceBranch)) {
      common.triggerError('Source branch not provided, could not create the Pull Request', deferred, input.logDepth);
      return deferred.promise;
    }

    var getDevBranchInfo;
    input.logDepth++;
    if (_.isDefinedNotNull(input.jira.issue)) {
      getDevBranchInfo = common.getPromiseForStep({ getDevBranchName: [] }, input);
    } else {
      getDevBranchInfo = function () { return Q.when(input); };
    }
    input.logDepth--;

    getDevBranchInfo()
      .then(function (data) {
        if (_.isDefinedNotNull(data.dev)) {
          prTitle = data.dev.issueType + '(' + data.dev.issueKey + '): ' + input.jira.issue.fields.summary;
        } else {
          prTitle = sourceBranch + ' -> ' + targetBranch;
        }

        var params = {
          user: userName,
          repo: projectName,
          title: prTitle,
          base: sourceBranch,
          head: targetBranch
        };

        Q.ninvoke(input.github.api.pullRequests, 'create', params)
          .then(function (pr) {
            common.log('Pull request successfully created: ' + pr.html_url, input.logDepth);
            common.triggerSuccess(input, {
              github: {
                pr: pr
              }
            }, deferred, input.logDepth);
          }, function (err) {
            if (/already exists/.test(err.message)) {
              common.log('Pull request already exists. Fetching...', input.logDepth);
              input.logDepth++;
              common.getPromiseForStep({ 'getPullRequestBetween': [userName, projectName, sourceBranch, targetBranch] }, input)()
                .then(function (data) {
                  input.logDepth--;
                  common.triggerSuccess(input, {
                    github: {
                      pr: data.github.pr
                    }
                  }, deferred, input.logDepth);
                }, function (err) {
                  common.triggerError(err, deferred, input.logDepth);
                })
                .done();
            } else {
              common.triggerError(err, deferred, input.logDepth);
            }
          })
          .done();
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Github.createPullRequest.requires = ['getGithubProject', 'getCurrentBranch'];

  Github.assignPullRequest = function githubAssignPullRequest(input, assignee, userName, projectName, sourceBranch, targetBranch) {
    var deferred = Q.defer();
    sourceBranch = sourceBranch || input.git.currentBranch;
    targetBranch = targetBranch || 'master';
    userName = userName || input.github.project.owner.login;
    projectName = projectName || input.github.project.name;
    var prTitle = '';
    var _name = 'Gitlab.assignPullRequest(' + assignee + ', ' + userName + ', ' + projectName + ', ' + sourceBranch + ', ' + targetBranch + ')';
    common.logStart(_name, input.logDepth);

    var getPR;
    input.logDepth++;
    if (_.isUndefinedOrNull(input.github.pr)) {
      getPR = common.getPromiseForStep({ getPullRequestBetween: [userName, projectName, sourceBranch, targetBranch] }, input);
    } else {
      getPR = function () { return Q.when(input); };
    }
    input.logDepth--;

    getPR()
      .then(function (data) { // data == input
        var params = {
          user: userName,
          repo: projectName,
          number: data.github.pr.number,
          assignee: assignee
        };

        Q.ninvoke(input.github.api.issues, 'edit', params)
          .then(function (pr) {
            common.log('Pull request successfully assigned to ' + assignee, input.logDepth);
            common.triggerSuccess(input, {
              github: {
                pr: pr
              }
            }, deferred, input.logDepth);
          }, function (err) {
            common.triggerError(err, deferred, input.logDepth);
          })
          .done(); // end Q.ninvoke
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done(); // end getPR

    return deferred.promise;
  };
  Github.assignPullRequest.requires = [];

  return Github;
})(require('lodash'), require('q'), require('./Common'));