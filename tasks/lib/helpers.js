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

  var gruntMock = {
    log: {
      debug: function (msg) {
        console.log('[DEBUG]', msg);
      },
      success: function (msg) {
        console.log('[SUCCESS]', msg);
      },
      fail: function (msg) {
        console.log('[FAIL]', msg);
      },
      writeln: function (msg) {
        console.log('[MSG]', msg);
      }
    }
  };
  grunt = grunt || gruntMock;

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
//  jiraClient.registerMethod('getOneProject', '${url}/rest/api/latest/project/${projectId}', 'GET');
  jiraClient.registerMethod('getSession', '${url}/rest/auth/latest/session', 'GET');
  jiraClient.registerMethod('getAllProjects', '${url}/rest/api/latest/project', 'GET');

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
//  gitlabClient.registerMethod('getOneProject', '${url}/api/v3/projects/${projectId}', 'GET');
  gitlabClient.registerMethod('getCurrentUser', '${url}/api/v3/user', 'GET');
  gitlabClient.registerMethod('getAllProjects', '${url}/api/v3/projects', 'GET');
  gitlabClient.registerMethod('postMergeRequest', '${url}/api/v3/projects/${projectId}/merge_requests', 'POST');
  gitlabClient.registerMethod('putMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}', 'PUT');
  gitlabClient.registerMethod('putAcceptMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}/merge', 'PUT');

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
   * @param  {object} issueTypeName  the issue type name (Bug, Task, Feature...) of the JIRA card
   * @return {promise}
   */
  var getJiraStatus = function (status, issue) {
    var deferred = Q.defer();

    var args = _.merge({
      path: {
        issue: issue.key
      }
    }, jiraArgs);

    jiraClient.methods.getAllIssueTransitions(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        data = data.transitions;
        var jiraStatus = null,
          i = 0;
        while (!jiraStatus && i < data.length) {
          console.log(data[i].name, '===', status);
          if (data[i].to.name === status) {
            jiraStatus = data[i];
          }
          i++;
        }
        if (jiraStatus) {
          deferred.resolve(jiraStatus);
        }
        else {
          deferred.reject(new Error('JIRA status "' + status + '" could not be found.'));
        }
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

    var args = _.merge({
      path: {
        projectId: config.gitlab.projectId,
        branch: branchName
      }
    }, gitlabArgs);

    gitlabClient.methods.getOneBranch(args, function (data, response) {
      if (response.statusCode !== 200) {
        if (response.statusCode === 404) {
          deferred.resolve(false);
        }
        else {
          grunt.log.debug(response.client._httpMessage.path + '\n', data);
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

    var args = _.merge({
      parameters: {
        state: 'opened'
      },
      path: {
        projectId: config.gitlab.projectId
      }
    }, gitlabArgs);

    gitlabClient.methods.getAllMergeRequests(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
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
        if (id) {
          deferred.resolve(id);
        }
        else {
          deferred.reject(new Error('Merge request for the project "' + config.gitlab.project + '" could not be found.'));
        }
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

    var args = _.merge({
      path: {
        projectId: config.gitlab.projectId,
        mrId: mrId
      }
    }, gitlabArgs);

    gitlabClient.methods.getOneMergeRequest(args, function (data, response) {
      if (response.statusCode !== 200) {
        if (response.statusCode === 404) {
          deferred.resolve(false);
        }
        else {
          grunt.log.debug(response.client._httpMessage.path + '\n', data);
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

    var args = _.merge({
      parameters: {
        per_page: 1000
      }
    }, gitlabArgs);

    gitlabClient.methods.getAllUsers(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
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
        if (user) {
          deferred.resolve(user);
        }
        else {
          deferred.reject(new Error('User with the username "' + assignee + '" could not be found.'));
        }
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
   * Name of the current branch in the local git repo
   * @type {string}
   */
  exports.currentBranch = null;

  /**
   * Object containing information from the JIRA Card
   * @type {object}
   */
  exports.jiraCard = null;

  /**
   * Gets the id of a Gitlab project with the given name
   * @param name
   * @returns {promise}
   */
  exports.getGitlabProjectId = function (name) {
    var deferred = Q.defer();

    var args = _.merge({
      parameters: {
        per_page: 1000
      }
    }, gitlabArgs);

    gitlabClient.methods.getAllProjects(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        var id = null,
          i = 0;
        while (!id && i < data.length) {
          if (data[i].name === name) {
            id = data[i].id;
          }
          i++;
        }
        if (id) {
          deferred.resolve(id);
        }
        else {
          deferred.reject(new Error('Gitlab project named "' + name + '" could not be found.'));
        }
      }
    });

    return deferred.promise;
  };

  /**
   * Gets the id of a JIRA project with the given name
   * @param name
   * @returns {promise}
   */
  exports.getJiraProjectId = function (name) {
    var deferred = Q.defer();

    jiraClient.methods.getAllProjects(jiraArgs, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        var id = null,
          i = 0;
        while (!id && i < data.length) {
          if (data[i].name === name) {
            id = data[i].id;
          }
          i++;
        }
        if (id) {
          deferred.resolve(id);
        }
        else {
          deferred.reject(new Error('JIRA project named "' + name + '" could not be found.'));
        }
      }
    });

    return deferred.promise;
  };

  /**
   * Performs a git checkout branch command
   * @param branch
   * @returns {promise}
   */
  exports.gitCheckout = function (branch) {
    var deferred = Q.defer();

    gitBranches().then(function (branches) {

      exports.currentBranch = branches.current;

      if (branches.current !== branch) {
        exec('git checkout ' + branch, function (err) {
          if (err) {
            deferred.reject(new Error(err));
          }
          else {
            exports.currentBranch = branches.current;
            deferred.resolve(branch);
            grunt.log.writeln('Switched to branch ' + branch + '.');
          }
        });
      }

    }, function (err) {
      deferred.reject(new Error(err));
    });

    return deferred.promise;
  };

  /**
   * Performs a git merge <from> <to> command
   * @param from
   * @param to
   * @returns {promise}
   */
  exports.gitMerge = function (from, to) {
    var deferred = Q.defer();

    exec('git merge ' + from + ' ' + to, function (err) {
      if (err) {
        deferred.reject(new Error(err));
      }
      else {
        deferred.resolve(true);
        grunt.log.writeln('Merge branch ' + from + ' to ' + to + '.');
      }
    });

    return deferred.promise;
  };

  /**
   * Performs a git cherry-pick <commit> command
   * @param commit
   * @returns {promise}
   */
  exports.gitCherryPick = function (commit) {
    var deferred = Q.defer();

    if (!commit) {
      deferred.reject(new Error('You must specify a Commit SHA1 string as parameter (grunt ttdev(...) --commit=COMMIT_SHA1).'));
    }
    else {
      exec('rm -f .git/index.lock', function (err) {

        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          exec('git cherry-pick ' + commit + ' -m 1', function (err) {
            if (err) {
              if (!err.toString().match(/git commit --allow-empty/)) {
                deferred.reject(new Error(err));
              }
              else {
                exec('git reset', function (err) {
                  if (err) {
                    deferred.reject(new Error(err));
                  }
                  else {
                    deferred.resolve(true);
                  }
                });
              }
            }
            else {
              deferred.resolve(true);
              grunt.log.writeln('Commit ' + commit + ' moved to ' + exports.currentBranch + '.');
            }
          });
        }

      });
    }

    return deferred.promise;
  };

  /**
   * Checks if the credentials provided by the user are correct to login to the JIRA API
   * @return {promise}
   */
  exports.checkJiraConnection = function () {
    var deferred = Q.defer();

    var args = _.merge({
      path: {
        projectId: config.jira.projectId
      }
    }, jiraArgs);

    jiraClient.methods.getSession(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
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

    gitlabClient.methods.getCurrentUser(gitlabArgs, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
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

    var args = _.merge({
      path: {
        project: config.jira.project,
        issue: cardname
      }
    }, jiraArgs);

    jiraClient.methods.getOneIssue(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        if (data.total === 1) {
          grunt.log.success('JIRA card "' + cardname + '" was found.');
          exports.jiraCard = data.issues[0];
          deferred.resolve(data.issues[0]);
        }
        else if (data.total === 0) {
          grunt.log.debug(response.client._httpMessage.path + '\n', data);
          deferred.reject(new Error('The following JIRA card could not be found for the project "' + config.jira.project + '": ' + cardname));
        }
        else {
          grunt.log.debug(response.client._httpMessage.path + '\n', data);
          deferred.reject(new Error('More than 1 JIRA card has been found with the string "' + cardname + '".'));
        }
      }
    });

    return deferred.promise;
  };

  /**
   * Performs a git pull command
   * @param {string}  repo
   * @param {string}  branch
   * @param {boolean} withRebase
   * @returns {promise}
   */
  exports.gitPull = function (repo, branch, withRebase) {
    var deferred = Q.defer();

    // shuffle args if branch (and repo) is (are) not defined
    repo = repo || 'origin';
    branch = branch || 'master';
    var option = withRebase ? '--rebase ' : '';

    gitBranches().then(function (branches) {
      if (branches.current !== 'master') {
        exports.gitCheckout('master');
      }
      // current branch is master
      exec('git pull ' + option + repo + ' ' + branch, function (err, data) {
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
  exports.gitCreateBranch = function (branchName, withCheckout) {
    var deferred = Q.defer();
    var option = '',
      cmd = '',
      branchExists;

    gitBranches().then(function (branches) {
      branchExists = (branches.current === branchName || _.contains(branches.others, branchName));
      if (withCheckout) {
        // option = '-b' if the branch doesn't exist yet, '' otherwise
        option = branchExists ? '' : '-b ';
        cmd = 'git checkout ' + option + branchName;
      }
      else {
        if (!branchExists) {
          cmd = 'git branch ' + branchName;
        }
      }

      exec(cmd, function (err, data) {
        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          if (!branchExists) {
            grunt.log.success('New branch created: ' + branchName + '.');
          }
          if (branches.current !== branchName && withCheckout) {
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
  exports.gitPush = function (repo, branch) {
    var deferred = Q.defer();

    repo = repo || 'origin';
    branch = branch || exports.branchName || '';

    gitBranches().then(function (branches) {
      checkBranch(exports.branchName).then(function (branchExists) {
        // if (!branchExists) {;
        var option = (branchExists) ? '-u' : '';
        exec('git push ' + option + ' ' + repo + ' ' + branch, function (err, data) {
          if (err) {
            deferred.reject(new Error(err));
          }
          else {
            grunt.log.success('Branch ' + branch + ' was pushed to remote repository.');
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
   * @param  {string} refBranch
   * @return {promise}
   */
  exports.createMergeRequest = function (refBranch) {
    var deferred = Q.defer();

//    getMergeRequestId().then(function (id) {
//      checkMergeRequest(id).then(function (mrExists) {
//        if (!mrExists) {
    var args = _.merge({
      headers: {
        "Content-Type": "application/json"
      },
      data: {
        "id": config.gitlab.projectId,
        "source_branch": exports.branchName,
        "target_branch": refBranch,
        "title": exports.jiraCard.fields.description
      },
      path: {
        projectId: config.gitlab.projectId
      }
    }, gitlabArgs);

    gitlabClient.methods.postMergeRequest(args, function (data, response) {
      if (response.statusCode !== 201) { // 201 = HTTP CREATED
        grunt.log.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        grunt.log.success('Merge request "' + args.data.title + '" successfully created.');
        deferred.resolve(data);
      }
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

    getJiraStatus(to, exports.jiraCard).then(function (status) {

      var args = _.merge({
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
      }, jiraArgs);

      jiraClient.methods.postIssueTransition(args, function (data, response) {
        if (response.statusCode !== 204) {
          grunt.log.debug(response.client._httpMessage.path + '\n', data);
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

        var args = _.merge({
          headers: {
            "Content-Type": "application/json"
          },
          data: {
            assignee_id: user.id
          },
          path: {
            projectId: config.gitlab.projectId,
            mrId: id
          }
        }, gitlabArgs);

        gitlabClient.methods.putMergeRequest(args, function (data, response) {
          if (response.statusCode !== 200) {
            grunt.log.debug(response.client._httpMessage.path + '\n', data);
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

  /**
   * Accepts a merge request
   * @returns {promise}
   */
  exports.acceptMergeRequest = function () {
    var deferred = Q.defer();

    getMergeRequestId().then(function (id) {

      var args = _.merge({
        headers: {
          "Content-Type": "application/json"
        },
        path: {
          projectId: config.gitlab.projectId,
          mrId: id
        },
        data: {}
      }, gitlabArgs);

      gitlabClient.methods.putAcceptMergeRequest(args, function (data, response) {
        if (response.statusCode !== 200) {
          grunt.log.fail('URL -> ' + response.client._httpMessage.path + '\n', data);
          deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
        }
        else {
          grunt.log.success('Merge request "' + exports.jiraCard.fields.description + '" has been accepted!');
          deferred.resolve(data);
        }
      });

    }, function (err) {
      deferred.reject(new Error(err));
    });
    return deferred.promise;
  };

  return exports;
};