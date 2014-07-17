/**
 * @name helpers.js
 * 
 * @copyright 2014 Teads Technology
 */

'use strict';

/**
 * @param  {Object} config
 * @param  {Object} grunt
 * @return {Object}
 */
exports.init = function (config, grunt) {

  // object returned by the init function
  var exports = {};

  // external libs
  var Q = require('q');
  var Buffer = require('buffer').Buffer;
  var Client = require('node-rest-client').Client;
  var exec = require('child_process').exec;
  var _ = require('lodash');

  // instance of Client used to make connections to JIRA and GitLab APIs
  var client = new Client();

  /**
   * Generates a base64 string from the data of the arg "credentials"
   * @param  {Object} credentials
   * @example
   * var credentials = {
   *   username: 'bob',
   *   password: 'bob123'
   * };
   * @return {String}
   */
  var getJiraCredentialsString = function (credentials) {
    return new Buffer(credentials.username + ':' + credentials.password).toString('base64');
  };

  /**
   * Gets the branches of the current git project
   * @return {Promise} 
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
   * Name of the branch where the feature/fix/... is developed
   * @type {String}
   */
  exports.branchName = null;

  /**
   * Object containing information from the JIRA Card
   * @type {Object}
   */
  exports.jiraCard = null;

  /**
   * Displays the error and triggers the end of the grunt task
   * @param  {Object}   err
   * @param  {Function} done
   */
  exports.failTask = function (err, done) {
    grunt.log.fail(err);
    done();
  };

  /**
   * Checks if the credentials provided by the user are correct to login to the JIRA API
   * @return {Promise}
   */
  exports.checkJiraConnection = function () {
    var jiraCredentialsStr = getJiraCredentialsString(config.jira.credentials);
    var deferred = Q.defer();
    client.get(config.jira.url + '/rest/api/latest/project/' + config.jira.managerTestId, {headers: {"Authorization": "Basic " + jiraCredentialsStr}}, function(data, response) {
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
        grunt.log.success('Connection to JIRA established.');
        deferred.resolve(data);
      }
    });
    return deferred.promise;
  };

  /**
   * Checks if the token provided by the user is correct to login to the GitLab API
   * @return {Promise}
   */
  exports.checkGitlabConnection = function () {
    var deferred = Q.defer();
    client.get(config.gitlab.url + '/api/v3/projects?private_token=' + config.gitlab.token, function(data, response) {
      if (response.statusCode !== 200) {
        deferred.reject(new Error('Connection to GitLab API could not be established. Reason: ' + data.message));
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
   * @param  {String} cardname
   * @return {Promise}
   */
  exports.checkJiraCard = function (cardname) {
    var deferred = Q.defer();
    var jiraCredentialsStr = getJiraCredentialsString(config.jira.credentials);
    client.get(config.jira.url + '/rest/api/latest/issue/' + cardname, {headers: {"Authorization": "Basic " + jiraCredentialsStr}}, function(data, response) {
      if (response.statusCode !== 200) {
        var errMessage = '(CheckJiraCard) Error ' + response.statusCode;
        if (response.statusCode === 404) {
          errMessage = 'The following JIRA card could not be found: ' + cardname;
        }
        deferred.reject(new Error(errMessage));
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
   * @param  {String} branchName 
   * @return {Promise}            
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

  exports.gitPushOrigin = function (branchName) {
    var deferred = Q.defer();
    gitBranches().then(function (branches) {
      exec('git push -u origin ' + exports.branchName, function (err, data) {
        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          grunt.log.success('Branch ' + exports.branchName + ' was pushed to remote repository.');
          deferred.resolve(data);
        }
      });
    }, function (err) {
      deferred.reject(new Error(err));
    });
    return deferred.promise;
  };

  exports.createMergeRequest = function () {
    var deferred = Q.defer();
    var args = {
      headers: { "Content-Type": "application/json" },
      data: {
        "id": config.gitlab.taskId,
        "source_branch": exports.branchName,
        "target_branch": config.gitlab.mr.refBranch,
        "title": exports.jiraCard.fields.description
      }
    };
    client.post(config.gitlab.url + '/api/v3/projects/' + config.gitlab.taskId + '/merge_requests?private_token=' + config.gitlab.token, args, function(data, response) {
      if (response.statusCode !== 201) { // 201 = HTTP CREATED
        deferred.reject(new Error('Creation of the merge request failed. Reason: ' + data.message));
      }
      else {
        grunt.log.success('Merge request "' + args.data.title + '" successfully created.');
        deferred.resolve(data);
      }
    });
    return deferred.promise;
  };

  exports.moveJiraCard = function (from, to) {
    
  };

  exports.assignMergeRequest = function (assignee) {
    
  };

  exports.checkBranch = function (branchName) {
    
  };

  exports.checkMergeRequest = function (mrId) {

  };

  return exports;
};