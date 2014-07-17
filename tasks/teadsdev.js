/**
 * @name teadsdev.js
 * 
 * @copyright 2014 Teads Technology
 */

'use strict';

module.exports = function (grunt) {

  var config = {
    gitlab: {
      url: 'https://git.teads.tv',
      project: 'manager',
      managerId: 4
    },
    jira: {
      url: 'https://jira.teads.tv',
      project: 'manager',
      managerId: 10300,
      managerTestId: 10605
    }
  };

  // external libs
  var credentials = require('./credentials');
  var Q = require('q');

  config.gitlab.token = credentials.gitlab.token;
  config.jira.credentials = credentials.jira;

  var helpers = require('./lib/helpers').init(config, grunt);

  grunt.registerTask('teadsdev', 'Handle the workflow when creating and finishing a feature in a Teads project', function (step, card) {

    // indicates to Grunt that this task uses asynchronous calls
    var done = this.async(),
        checkJiraConnectionPromise = helpers.checkJiraConnection(),
        checkGitlabConnectionPromise = helpers.checkGitlabConnection(),
        allConnectionsChecksPromise = Q.all([ checkJiraConnectionPromise, checkGitlabConnectionPromise]);
  
    allConnectionsChecksPromise.then(function () {
      helpers.checkJiraCard(card).then(function () {
        // connections established, JIRA card found -> let's go!
        var branchName = 'feat-' + card;
        helpers.gitPullRebaseOrigin().then(function () {

          helpers.gitCreateAndSwitchBranch(branchName).then(function () {
            // branch created, we can push to remote
            helpers.gitPushOrigin().then(function () {
              // branch pushed, we can create merge request
              // TODO

            });

          }, function (err) {
            helpers.failTask(err, done);
          });

        }, function (err) {
          helpers.failTask(err, done);
        });

      }, function (err) {
        helpers.failTask(err, done);
      });

    }, function (err) {
      helpers.failTask(err, done);
    });

  });

};