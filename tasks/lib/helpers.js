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
   
        data = data.replace(/  /, '').split('\n');
        for (var i = 0; i < data.length; i++) {
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
        deferred.resolve(data);
      }
    });
    return deferred.promise;
  };

  exports.gitPullRebaseOrigin = function () {
    var deferred = Q.defer();
    gitBranches().then(function (branches) {
      deferred.resolve(branches);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  exports.gitCreateAndSwitchBranch = function (branchName) {
    
  };

  exports.gitPushOrigin = function () {
    
  };

  exports.createMergeRequest = function () {
    
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