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

  var jiraArgs = {};
  jiraClient.registerMethod('getOneStatus', '${url}/rest/api/latest/status/${status}', 'GET');
  jiraClient.registerMethod('getOneIssue', '${url}/rest/api/latest/issue/${issue}', 'GET');
  jiraClient.registerMethod('getOneProject', '${url}/rest/api/latest/project/${projectId}', 'GET');

  /**
   * Arguments to pass to node-rest-client methods
   * @type {object}
   */
  var gitlabArgs = {
    headers: {
      "PRIVATE-TOKEN": config.gitlab.token
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
   * @return {promise}
   */
  var getJiraStatus = function (status) {
    var deferred = Q.defer();

    var args = _.merge(jiraArgs, {
      path: {
        url: config.jira.url,
        status: status
      }
    });

    jiraClient.methods.getOneStatus(args, function (data, response) {
      if (response.statusCode !== 200) {
        grunt.log.debug('', data);
        deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        deferred.resolve(data);
      }
    });

    return deferred.promise;
  };

  /**
   * Uses the GitLab API to check if the branch "branchName" already exists on the remote repository or not
   * @param  {string} branchName
   * @return {boolean}            true if the branch exists, false otherwise
   */
  var checkBranch = function (branchName) {
    var deferred = Q.defer();

    var args = _.merge(gitlabArgs, {
      path: {
        url: config.gitlab.url,
        projectId: config.gitlab.taskId,
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
        url: config.gitlab.url,
        projectId: config.gitlab.taskId
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
        url: config.gitlab.url,
        projectId: config.gitlab.taskId,
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
      },
      path: {
        url: config.gitlab.url
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
        url: config.jira.url,
        projectId: config.jira.managerTestId
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
        url: config.gitlab.url,
        projectId: config.gitlab.taskId
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
        url: config.jira.url,
        issue: cardname
      }
    });

    jiraClient.methods.getOneIssue(args, function (data, response) {
      if (response.statusCode !== 200) {
        if (response.statusCode === 404) {
          grunt.log.debug('', data);
          deferred.reject(new Error('The following JIRA card could not be found: ' + cardname));
        }
        else {
          grunt.log.debug('', data);
          deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
        }
      }
      else {
        grunt.log.success('JIRA card "' + cardname + '" was found.');
        exports.jiraCard = data;
        deferred.resolve(data);
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
      var option = (branches.current !== branchName && !_.contains(branches.others, branchName)) ? '-b' : '';
      exec('git checkout ' + option + ' ' + branchName, function (err, data) {
        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          if (option === '-b') {
            grunt.log.success('New branch created: ' + branchName + '.');
          }
          grunt.log.writeln('Switched to branch ' + branchName + '.');
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
              "id": config.gitlab.taskId,
              "source_branch": exports.branchName,
              "target_branch": config.gitlab.mr.refBranch,
              "title": exports.jiraCard.fields.description
            },
            path: {
              url: config.gitlab.url,
              projectId: config.gitlab.taskId
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

    // client.get(config.jira.url + '/rest/api/latest/issue/MANTEST-1', {headers: {"Authorization": "Basic " + jiraCredentialsStr}}, function(data, response) {
    client.get(config.jira.url + '/rest/api/latest/status/Reviews', {headers: {"Authorization": "Basic " + jiraCredentialsStr}}, function(data, response) {
      if (response.statusCode !== 200) {
        var errMessage = response.statusCode + ' Connection to JIRA API could not be established.';
        if (data.errorMessages) {
          for (var i = 0; i < data.errorMessages.length; i++) {
            errMessage += '\n  ' + data.errorMessages[i];
          }
        }
        deferred.reject(new Error(errMessage));
      }
      else {
        var args = {
          headers: { "Content-Type": "application/json", "Authorization": "Basic " + jiraCredentialsStr },
          data: {
            "fields": {
              "status": data
            }
          }
        };
        /**/
        /* TODO */
        /* SCREEN to expose properties of issues and edit them */
        /**/
        console.log(args);
        client.put(config.jira.url + '/rest/api/latest/issue/MANTEST-1', args, function(data, response) {
          if (response.statusCode !== 200) {
            // console.log(response);
            console.log('DATA', data);
            var errMessage = response.statusCode + ' Connection to JIRA API could not be established.';
            if (data.errorMessages) {
              for (var i = 0; i < data.errorMessages.length; i++) {
                errMessage += '\n  ' + data.errorMessages[i];
              }
            }
            deferred.reject(new Error(errMessage));
          }
          else {
            console.log('MOVED');
            deferred.resolve(data);
          }
        });
      }
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
            url: config.gitlab.url,
            projectId: config.gitlab.taskId,
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

  exports.reset = function () {
    // switch to master
    // delete local feat branch
    // close mr
    // delete remote feat branch
    // move card jira to TODO

  };

  return exports;
};