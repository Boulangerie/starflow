module.exports = (function (_, Q, common) {
  'use strict';

  var Git = {};

  Git.setApiInstance = function GitSetApiInstance(input) {
    var deferred = Q.defer();
    var _name = 'Git.setApiInstance';
    common.logStart(_name, input.logDepth);

    var GitApi = require('gitty');
    try {
      var api = new GitApi('.');
      api.isShared = true;
      common.triggerSuccess(input, {
        git: {
          api: api
        }
      }, deferred, input.logDepth);
    }
    catch (err) {
      common.triggerError(err, deferred, input.logDepth);
    }
    return deferred.promise;
  };

  /**
   * @requires git.api
   */
  Git.getCurrentBranch = function GitGetCurrentBranch(input) {
    var deferred = Q.defer();
    var _name = 'Git.getCurrentBranch';
    common.logStart(_name, input.logDepth);
    
    if (_.allUndefinedOrNull(input.git.api)) {
      common.triggerError(_name + ' requires: git.api', deferred, input.logDepth);
    }
    else {
      Q.ninvoke(input.git.api, 'getBranches')
        .then(function (branches) {
          common.log('Current branch: ' + branches.current);
          common.triggerSuccess(input, {
            git: {
              currentBranch: branches.current
            }
          }, deferred, input.logDepth);
        }, function gitGetBranchesError(err) {
          common.triggerError(err, deferred, input.logDepth);
        })
        .done();
    }
    return deferred.promise;
  };
  Git.getCurrentBranch.requires = ['setGitApiInstance'];

  /**
   * Generate the dev branch name (e.g. feat/MAN-123/issue-slug)
   * @param  {object} input Data stream
   * @return {promise} 
   */
  Git.getDevBranchName = function GitGetDevBranchName(input) {
    var deferred = Q.defer();
    var issueType, step, branchName;
    var slugify = require('slugify');
    var _name = 'Git.getDevBranchName';
    common.logStart(_name, input.logDepth);

    input.logDepth++;
    if (!_.isUndefinedOrNull(input.jira.issue.fields.parent)) {
      // jira issue has a parent -> better get the parent's issuetype (e.g. new-feature) instead to avoid having "sub-task" as issuetype of this issue
      step = common.getPromiseForStep({ 'getJiraIssue': [input.jira.issue.fields.parent.key] }, input);
      common.log('JIRA issue is a sub-task, fetching its parent\'s issue type...');
    }
    else {
      step = function () { return Q.when(input); };
    }
    input.logDepth--;

    step()
      .then(function (res) {
        if (_.isUndefined(res)) { // res is undefined -> step = function () { return Q.when(); }; => issue had no parent
          issueType = input.jira.issue.fields.issuetype.name;
        }
        else { // issue had a parent, it is stored in res.jira.issue
          issueType = res.jira.issue.fields.issuetype.name;
        }
        var mapBranchTpl = {
          issueType: slugify(issueType.toLowerCase()),
          issueKey: input.jira.issueKey,
          issueSlug: slugify(input.jira.issue.fields.summary.toLowerCase())
        };
        branchName = common.generateDevBranchName(input.branchTpl, mapBranchTpl);
        common.log('Dev branch name: ' + branchName, input.logDepth);
        common.triggerSuccess(input, {
          dev: {
            branchName: branchName,
            issueType: mapBranchTpl.issueType,
            issueKey: mapBranchTpl.issueKey,
            issueSlug: mapBranchTpl.issueSlug
          }
        }, deferred, input.logDepth);
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();
    return deferred.promise;
  };
  Git.getDevBranchName.requires = ['getJiraIssue'];

  /**
   * @requires git.api, input.branchTpl
   */
  Git.createBranch = function GitCreateBranch(input, branchName) {
    var deferred = Q.defer();
    var Jira = require('./Jira');
    branchName = branchName || (!Jira.isIssueNum(input.jira.issueNum) ? input.jira.issueNum : undefined) || input.dev.branchName;
    var _name = 'Git.createBranch';
    common.logStart(_name, input.logDepth);
    
    if (_.allUndefinedOrNull(input.git.api, input.branchTpl)) {
      common.triggerError(_name + ' requires: git.api, branchTpl', deferred, input.logDepth);
      return deferred.promise;
    }

    Q.ninvoke(input.git.api, 'createBranch', branchName)
      .then(function () {
        common.log('Created branch: ' + branchName);
        common.triggerSuccess(input, {
          git: {
            lastBranchCreated: branchName
          }
        }, deferred, input.logDepth);
      }, function (err) {
        if (!/already exists/.test(err.message)) {
          common.triggerError(err, deferred, input.logDepth);
        }
        branchName = err.message.match(/A branch named \'(.+)\' already exists/)[1];

        common.log(('The branch "' + branchName + '" could not be created because it already exists').yellow);
        common.triggerSuccess(input, {
          git: {
            lastBranchCreated: branchName
          }
        }, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Git.createBranch.requires = ['setGitApiInstance', 'getDevBranchName'];

  function _logGitResponse(res) {
    for (var i = res.length-1; i >= 0; i--) {
      _.forEach(res[i].split('\n'), function (val) {
        if (val !== '') {
          common.log(val);
        }
      });
    }
  };

  /**
   * @requires git.api
   */
  Git.checkout = function GitCheckout(input, branch) {
    var deferred = Q.defer();
    branch = branch || input.git.lastBranchCreated || input.git.devBranchName || 'master';
    var _name = 'Git.checkout(' + branch + ')';
    common.logStart(_name, input.logDepth);
    
    if (_.allUndefinedOrNull(input.git.api)) {
      common.triggerError(_name + ' requires: git.api', deferred, input.logDepth);
      return deferred.promise;
    }

    Q.ninvoke(input.git.api, 'checkout', branch)
      .then(common.getPromiseForStep({ getCurrentBranch: [] }, input))
      .then(function (branches) {
        common.triggerSuccess(input, {
          git: {
            currentBranch: branches.current
          }
        }, deferred, input.logDepth);
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Git.checkout.requires = ['setGitApiInstance'];

  Git.fetch = function GitFetch(input, remote, branch) {
    var deferred = Q.defer();
    remote = remote || 'origin';
    branch = !_.isUndefined(branch) ? branch : (input.git.devBranchName || 'master');
    var _name = 'Git.fetch(' + remote + ', ' + (branch ? branch : 'all branches') + ')';
    common.logStart(_name, input.logDepth);

    var exec = require('child_process').exec;

    Q.nfcall(exec, 'git fetch ' + remote + ' ' + branch)
      .then(function (res) {
        _logGitResponse(res);
        common.triggerSuccess(input, {}, deferred, input.logDepth);
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();
    return deferred.promise;
  };
  Git.fetch.requires = ['setGitApiInstance'];

  Git.rebase = function GitFetch(input, sourceBranch, targetBranch) {
    var deferred = Q.defer();
    var _name = 'Git.rebase(' + sourceBranch + ', ' + targetBranch + ')';
    common.logStart(_name, input.logDepth);

    if (_.allUndefinedOrNull(sourceBranch, targetBranch)) {
      common.triggerError(_name + ' requires: sourceBranch, targetBranch (params)', deferred, input.logDepth);
      return deferred.promise;
    }

    var exec = require('child_process').exec;

    Q.nfcall(exec, 'git rebase ' + sourceBranch + ' ' + targetBranch)
      .then(function (res) {
        _logGitResponse(res);
        common.triggerSuccess(input, {}, deferred, input.logDepth);
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Git.rebase.requires = ['setGitApiInstance'];

  Git.push = function GitPush(input, remote, branch) {
    var deferred = Q.defer();
    remote = remote || 'origin';
    branch = branch || input.git.currentBranch || input.git.lastBranchCreated;
    var _name = 'Git.push(' + remote + ', ' + branch + ')';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(branch)) {
      common.triggerError('You must specify a branch name on the remote repository', deferred, input.logDepth);
      return deferred.promise;
    }

    var exec = require('child_process').exec;

    Q.nfcall(exec, 'git push ' + remote + ' ' + branch)
      .then(function (res) {
        _logGitResponse(res);
        common.triggerSuccess(input, {}, deferred, input.logDepth);
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Git.push.requires = ['setGitApiInstance'];

  return Git;
})(require('lodash'), require('q'), require('./Common'));