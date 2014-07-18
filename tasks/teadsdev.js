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
      managerId: 4,
      taskId: 226,
      mr: {
        doneAssignee: 'bruiz',
        refBranch: 'master'
      }
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

  var helpers = require('./lib/helpers').init(config, grunt, Q);

  grunt.registerTask('teadsdev', 'Handle the workflow when creating and finishing a feature in a Teads project', function (step, card) {

    if (grunt.option('test')) {
      var done = this.async();
      helpers.branchName = 'feat-MANTEST-1';

      helpers.getMergeRequestId().then(function (data) {
        console.log(data);
      }, function (err) {
        grunt.log.fail(err);
      });
      return;
    }

    // indicates to Grunt that this task uses asynchronous calls
    var //done = this.async(),
        checkJiraConnectionPromise = helpers.checkJiraConnection(),
        checkGitlabConnectionPromise = helpers.checkGitlabConnection(),
        allConnectionsChecksPromise = Q.all([ checkJiraConnectionPromise, checkGitlabConnectionPromise]),
        branchName = 'feat-' + card;

    if (step === 'new') {
      allConnectionsChecksPromise.then(function () {
        helpers.checkJiraCard(card).then(function () {
          // connections established, JIRA card found -> let's go!
          helpers.gitPullRebaseOrigin().then(function () {

            helpers.gitCreateAndSwitchBranch(branchName).then(function () {
              // branch created, we can push to remote
              helpers.gitPushOrigin().then(function () {
                // branch pushed, we can create merge request
                
                helpers.createMergeRequest().then(function (data) {
                  console.log('You can now work on your feature/fix/whatever! :)');
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

        }, function (err) {
          helpers.failTask(err, done);
        });

      }, function (err) {
        helpers.failTask(err, done);
      })

      .then(function () {
        // helpers.moveJiraCard('to').then(function (data) {
        //   console.log('HEHE', data);
        // }, function (err) {
        //   grunt.log.error(err);
        // })
      });

    } // end step is 'new'
    else if (step === 'finish') {
      allConnectionsChecksPromise.then(function () {
        helpers.checkJiraCard(card).then(function () {
          // connections established, JIRA card found -> let's go!

          helpers.gitCreateAndSwitchBranch(branchName).then(function () {
            
            helpers.assignMergeRequest(config.gitlab.mr.doneAssignee).then(function () {

              helpers.gitPushOrigin().then(function () {

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

      }, function (err) {
        helpers.failTask(err, done);
      });

    }

  });

};