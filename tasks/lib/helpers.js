/**
 * @name helpers.js
 *
 * @copyright 2014 Teads Technology
 */

'use strict';

/**
 * @param  {object} config
 * @param  {object} grunt
 * @return {object}
 */
exports.init = function (config, grunt, Q) {

  // object returned by the init function
  var exports = {};

  // external libs
  var Client = require('node-rest-client').Client;
  var exec = require('child_process').exec;
  var _ = require('lodash');

  // instances of Client used to make connections to JIRA and GitLab APIs
  var jiraClient = new Client(config.jira.credentials);
  var gitlabClient = new Client();

  /**
   * Arguments to pass to jira node-rest-client methods
   * @type {object}
   */
  var jiraArgs = {
    path: {
      url: config.jira.host
    }
  };
  jiraClient.registerMethod('getAllIssueTransitions', '${url}/rest/api/latest/issue/${issue}/transitions', 'GET');
//  jiraClient.registerMethod('getOneIssue', '${url}/rest/api/latest/issue/${issue}', 'GET');
  jiraClient.registerMethod('getOneIssue', '${url}/rest/api/latest/search?jql=project=${project} and issue=${issue}', 'GET');
  jiraClient.registerMethod('postIssueTransition', '${url}/rest/api/latest/issue/${issue}/transitions', 'POST');
  jiraClient.registerMethod('getOneProject', '${url}/rest/api/latest/project/${projectId}', 'GET');

  /**
   * Arguments to pass to gitlab node-rest-client methods
   * @type {object}
   */
  var gitlabArgs = {
    headers: {
      "PRIVATE-TOKEN": config.gitlab.token
    },
    path: {
      url: config.gitlab.host
    }
  };
  gitlabClient.registerMethod('getAllMergeRequests', '${url}/api/v3/projects/${projectId}/merge_requests', 'GET');
  gitlabClient.registerMethod('getOneMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}', 'GET');
  gitlabClient.registerMethod('getOneBranch', '${url}/api/v3/projects/${projectId}/repository/branches/${branch}', 'GET');
  gitlabClient.registerMethod('getAllUsers', '${url}/api/v3/users', 'GET');
  gitlabClient.registerMethod('getOneProject', '${url}/api/v3/projects/${projectId}', 'GET');
  gitlabClient.registerMethod('postMergeRequest', '${url}/api/v3/projects/${projectId}/merge_requests', 'POST');
  gitlabClient.registerMethod('putMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}', 'PUT');

  /**
   * Gets the branches of the current git project
   * @return {promise}
   */
  var gitBranches = function () {
    var deferred = Q.defer();
    exec('git branch', function (err, data) {
      if (!err) {
        var branches = {
          current: null,
          others: []
        };

        data = data.split('\n');
        for (var i = 0; i < data.length; i++) {
          data[i] = data[i].trim();
          if (data[i].match(/\* (.+)/)) {
            branches.current = data[i].replace(/\* /, '');
          }
          else if (data[i] !== '') {
            branches.others.push(data[i]);
          }
        }

        deferred.resolve(branches);
      }
      else {
        deferred.reject(err);
      }
    });
    return deferred.promise;
  };

  /**
   * Uses JIRA API to get the object status that has the name given in param
   * @param  {string} status
   * @param  {string} issue  the JIRA card key (ex. MAN-123)
   * @return {promise}
   */
  var getJiraStatus = function (status, issue) {
    var deferred = Q.defer();

    var args = _.merge(jiraArgs, {
      path: {
        issue: issue
      }
    });

    jiraClient.methods.getAllIssueTransitions(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug('', data);
        deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        data = data.transitions;
        var jiraStatus = null,
          i = 0;
        while (!jiraStatus && i < data.length) {
          if (data[i].name === status) {
            jiraStatus = data[i];
          }
          i++;
        }
        deferred.resolve(jiraStatus);
      }
    });

    return deferred.promise;
  };

  /**
   * Uses the GitLab API to check if the branch "branchName" already exists on the remote repository or not
   * @param  {string} branchName
   * @return {promise}            resolved true if the branch exists, false otherwise. Rejected if error
   */
  var checkBranch = function (branchName) {
    var deferred = Q.defer();

    var args = _.merge(gitlabArgs, {
      path: {
        projectId: config.gitlab.managerId,
        branch: branchName
      }
    });

    gitlabClient.methods.getOneBranch(args, function (data, response) {
      if (response.statusCode !== 200) {
        if (response.statusCode === 404) {
          deferred.resolve(false);
        }
        else {
          grunt.log.debug('', data);
          deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
        }
      }
      else {
        deferred.resolve(true);
      }
    });

    return deferred.promise;
  };

  /**
   * Uses the GitLab API to get the id of the merge request
   * @return {promise}
   */
  var getMergeRequestId = function () {
    var deferred = Q.defer();

    var args = _.merge(gitlabArgs, {
      parameters: {
        state: 'opened'
      },
      path: {
        projectId: config.gitlab.managerId
      }
    });

    gitlabClient.methods.getAllMergeRequests(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug('', data);
        deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        var id = null,
          i = 0;
        while (!id && i < data.length) {
          if (data[i].source_branch === exports.branchName) {
            id = data[i].id;
          }
          i++;
        }
        deferred.resolve(id);
      }
    });

    return deferred.promise;
  };

  /**
   * Uses the GitLab API to check if the merge request already exists or not
   * @param  {integer} mrId
   * @return {promise}
   */
  var checkMergeRequest = function (mrId) {
    var deferred = Q.defer();

    var args = _.merge(gitlabArgs, {
      path: {
        projectId: config.gitlab.managerId,
        mrId: mrId
      }
    });

    gitlabClient.methods.getOneMergeRequest(args, function (data, response) {
      if (response.statusCode !== 200) {
        if (response.statusCode === 404) {
          deferred.resolve(false);
        }
        else {
          grunt.log.debug('', data);
          deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
        }
      }
      else {
        deferred.resolve(true);
      }
    });
    return deferred.promise;
  };

  /**
   * Uses the GitLab API to get the MR assigned user
   * @return {promise}
   */
  var getAssignee = function (assignee) {
    var deferred = Q.defer();

    var args = _.merge(gitlabArgs, {
      parameters: {
        per_page: 1000
      }
    });

    gitlabClient.methods.getAllUsers(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug('', data);
        deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        var user = null,
          i = 0;
        while (!user && i < data.length) {
          if (data[i].username === assignee) {
            user = data[i];
          }
          i++;
        }
        deferred.resolve(user);
      }
    });

    return deferred.promise;
  };

  /**
   * Name of the branch where the feature/fix/... is developed
   * @type {string}
   */
  exports.branchName = null;

  /**
   * Object containing information from the JIRA Card
   * @type {object}
   */
  exports.jiraCard = null;

  /**
   * Displays the error and triggers the end of the grunt task
   * @param  {object}   err
   * @param  {function} done
   */
  exports.failTask = function (err, done) {
//    grunt.log.fail(err);
    throw err;
    done(false);
  };

  /**
   * Checks if the credentials provided by the user are correct to login to the JIRA API
   * @return {promise}
   */
  exports.checkJiraConnection = function () {
    var deferred = Q.defer();

    var args = _.merge(jiraArgs, {
      path: {
        projectId: config.jira.managerId
      }
    });

    jiraClient.methods.getOneProject(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug('', data);
        deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        grunt.log.success('Connection to JIRA established.');
        deferred.resolve(data);
      }
    });

    return deferred.promise;
  };

  /**
   * Checks if the token provided by the user is correct to login to the GitLab API
   * @return {promise}
   */
  exports.checkGitlabConnection = function () {
    var deferred = Q.defer();

    var args = _.merge(gitlabArgs, {
      path: {
        projectId: config.gitlab.managerId
      }
    });

    gitlabClient.methods.getOneProject(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug('', data);
        deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        grunt.log.success('Connection to GitLab established.');
        deferred.resolve(data);
      }
    });

    return deferred.promise;
  };

  /**
   * Checks if the JIRA card with the key "cardname" exists or no
   * @param  {string} cardname
   * @return {promise}
   */
  exports.checkJiraCard = function (cardname) {
    var deferred = Q.defer();

    var args = _.merge(jiraArgs, {
      path: {
        project: 'manager_test',
        issue: cardname
      }
    });

    jiraClient.methods.getOneIssue(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug('', data);
        deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        if (data.total === 1) {
          grunt.log.success('JIRA card "' + cardname + '" was found.');
          exports.jiraCard = data.issues[0];
          deferred.resolve(data.issues[0]);
        }
        else if (data.total === 0) {
          grunt.log.debug('', data);
          deferred.reject(new Error('The following JIRA card could not be found: ' + cardname));
        }
        else {
          grunt.log.debug('', data);
          deferred.reject(new Error('More than 1 JIRA card has been found with the string "' + cardname + '".'));
        }
      }
    });

    return deferred.promise;
  };

  exports.gitPullRebaseOrigin = function () {
    var deferred = Q.defer();

    gitBranches().then(function (branches) {
      if (branches.current !== 'master') {
        exec('git checkout master', function (err, data) {
          if (err) {
            deferred.reject(new Error(err));
          }
          else {
            grunt.log.writeln('Switched to branch master.');
          }
        });
      }
      // current branch is master
      exec('git pull --rebase origin master', function (err, data) {
        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          grunt.log.writeln('Local master is now up-to-date.');
          deferred.resolve(data);
        }
      });
    }, function (err) {
      deferred.reject(new Error(err));
    });

    return deferred.promise;
  };

  /**
   * Creates a new branch 'branchName' (if it doesn't exist yet) and checkout to this branch
   * @param  {string} branchName
   * @return {promise}
   */
  exports.gitCreateAndSwitchBranch = function (branchName) {
    exports.branchName = branchName;
    var deferred = Q.defer();

    gitBranches().then(function (branches) {
      // option = '-b' if the branch doesn't exist yet, '' otherwise
      var option = (branches.current !== branchName && !_.contains(branches.others, branchName)) ? '-b' : '';
      exec('git checkout ' + option + ' ' + branchName, function (err, data) {
        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          if (option === '-b') {
            grunt.log.success('New branch created: ' + branchName + '.');
          }
          if (branches.current !== branchName) {
            grunt.log.writeln('Switched to branch ' + branchName + '.');
          }
          deferred.resolve(data);
        }
      });
    }, function (err) {
      deferred.reject(new Error(err));
    });

    return deferred.promise;
  };

  /**
   * Pushes the local feature branch to the remote repository
   * @param  {string} branchName
   * @return {promise}
   */
  exports.gitPushOrigin = function () {
    var deferred = Q.defer();

    gitBranches().then(function (branches) {
      checkBranch(exports.branchName).then(function (branchExists) {
        // if (!branchExists) {;
        var option = (branchExists) ? '-u' : '';
        exec('git push ' + option + ' origin ' + exports.branchName, function (err, data) {
          if (err) {
            deferred.reject(new Error(err));
          }
          else {
            grunt.log.success('Branch ' + exports.branchName + ' was pushed to remote repository.');
            deferred.resolve(data);
          }
        });
        // }
        // else {
        //   deferred.reject(new Error('The branch "' + exports.branchName + '" already exists on the remote repository.'));
        // }

      }, function (err) {
        deferred.reject(new Error(err));
      });

    }, function (err) {
      deferred.reject(new Error(err));
    });

    return deferred.promise;
  };

  /**
   * Creates a merge request on the Gitlab project
   * @return {promise}
   */
  exports.createMergeRequest = function () {
    var deferred = Q.defer();

    getMergeRequestId().then(function (id) {
      checkMergeRequest(id).then(function (mrExists) {
        if (!mrExists) {
          var args = _.merge(gitlabArgs, {
            headers: {
              "Content-Type": "application/json"
            },
            data: {
              "id": config.gitlab.managerId,
              "source_branch": exports.branchName,
              "target_branch": config.gitlab.mr.refBranch,
              "title": exports.jiraCard.fields.description
            },
            path: {
              projectId: config.gitlab.managerId
            }
          });

          gitlabClient.methods.postMergeRequest(args, function (data, response) {
            if (response.statusCode !== 201) { // 201 = HTTP CREATED
              grunt.log.debug('', data);
              deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
            }
            else {
              grunt.log.success('Merge request "' + args.data.title + '" successfully created.');
              deferred.resolve(data);
            }
          });
        }
        else { // mr already exists
          deferred.reject(new Error('The merge request associated to the branch "' + exports.branchName + '" already exists on the remote repository.'));
        }

      }, function (err) {
        deferred.reject(new Error(err));
      });

    }, function (err) {
      deferred.reject(new Error(err));
    });

    return deferred.promise;
  };

  /**
   * Changes to status of the JIRA card (-> move it from one column to another)
   * @param   {string} to
   * @returns {promise}
   */
  exports.moveJiraCard = function (to) {
    var deferred = Q.defer();

    getJiraStatus(to, exports.jiraCard.key).then(function (status) {

      var args = _.merge(jiraArgs, {
        headers: {
          "Content-Type": "application/json"
        },
        path: {
          status: status,
          issue: exports.jiraCard.key
        },
        data: {
          transition: {
            id: status.id
          }
        }
      });

      jiraClient.methods.postIssueTransition(args, function (data, response) {
        if (response.statusCode !== 204) {
          grunt.log.debug('', data);
          deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
        }
        else {
          grunt.log.success('JIRA card ' + exports.jiraCard.key + ' moved to ' + status.name + '.');
          deferred.resolve(data);
        }
      });
    }, function (err) {
      deferred.reject(new Error(err));
    });

    return deferred.promise;
  };

  /**
   * Assigns a GitLab user to review the merge request
   * @param  {string} assignee username
   * @return {promise}
   */
  exports.assignMergeRequest = function (assignee) {
    var deferred = Q.defer();

    getMergeRequestId().then(function (id) {
      getAssignee(assignee).then(function (user) {
        var args = _.merge(gitlabArgs, {
          headers: {
            "Content-Type": "application/json"
          },
          data: {
            assignee_id: user.id
          },
          path: {
            projectId: config.gitlab.managerId,
            mrId: id
          }
        });

        gitlabClient.methods.putMergeRequest(args, function (data, response) {
          if (response.statusCode !== 200) {
            grunt.log.debug('', data);
            deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
          }
          else {
            grunt.log.success('Merge request "' + exports.jiraCard.fields.description + '" assigned to ' + assignee + '.');
            deferred.resolve(data);
          }
        });

      }, function (err) {
        deferred.reject(new Error(err));
      });

    }, function (err) {
      deferred.reject(new Error(err));
    });
    return deferred.promise;
  };

  return exports;
};