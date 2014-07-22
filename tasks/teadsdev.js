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
      managerId: 226, // 4
      mr: {
        doneAssignee: 'bruiz',
        refBranch: 'master'
      }
    },
    jira: {
      url: 'https://jira.teads.tv',
      project: 'manager',
      managerId: 10605, // 10300
      statuses: {
        todo: 'Open',
        inprogress: 'In Progress',
        review: 'Reviews',
        done: 'Resolved'
      }
    }
  };

  // external libs
  var credentials = require('./credentials');
  var Q = require('q');

  config.gitlab.token = credentials.gitlab.token;
  config.jira.credentials = credentials.jira;

  var helpers = require('./lib/helpers').init(config, grunt, Q);

  grunt.registerTask('teadsdev', 'Handle the workflow when creating and finishing a feature in a Teads project', function (step, card) {

//    var done = this.async();
//    helpers.checkJiraCard(card)
//      .catch(function (err) {
//        grunt.log.fail(err);
//        done(false);
//      })
//      .then(function () {
//        return helpers.moveJiraCard('Reviews');
//      })
//      .catch(function (err) {
////        grunt.log.fail(err);
//        done(false);
//        throw err;
//      })
//      .then(function (data) {
//        grunt.log.success(data);
//      })
//      .done();
//    return;

    // indicates to Grunt that this task uses asynchronous calls
    var done = this.async(),
        checkJiraConnectionPromise = helpers.checkJiraConnection(),
        checkGitlabConnectionPromise = helpers.checkGitlabConnection(),
        allConnectionsChecksPromise = Q.all([ checkJiraConnectionPromise, checkGitlabConnectionPromise]),
        branchName = 'feat-' + card;


    allConnectionsChecksPromise
      .catch(function (err) {
        grunt.log.debug('Error on allConnectionsChecksPromise');
        helpers.failTask(err, done);
      })
      .then(function () {
        return helpers.checkJiraCard(card);
      })
      .catch(function (err) {
        grunt.log.debug('Error on checkJiraCard(' + card + ')');
        helpers.failTask(err, done);
      })
      .then(function () {
        if (step === 'new') {

          helpers.gitPullRebaseOrigin()
            .catch(function (err) {
              grunt.log.debug('Error on gitPullRebaseOrigin()');
              helpers.failTask(err, done);
            })
            .then(function () {
              return helpers.gitCreateAndSwitchBranch(branchName);
            })
            .catch(function (err) {
              grunt.log.debug('Error on gitCreateAndSwitchBranch(' + branchName + ')');
              helpers.failTask(err, done);
            })
            .then(function () {
              return helpers.gitPushOrigin();
            })
            .catch(function (err) {
              grunt.log.debug('Error on gitPushOrigin()');
              helpers.failTask(err, done);
            })
            .then(function () {
              return helpers.createMergeRequest();
            })
            .catch(function (err) {
              grunt.log.debug('Error on createMergeRequest()');
              helpers.failTask(err, done);
            })
            .then(function () {
              return helpers.moveJiraCard(config.jira.statuses.inprogress);
            })
            .catch(function (err) {
              grunt.log.debug('Error on moveJiraCard(' + config.jira.statuses.inprogress + ')');
              helpers.failTask(err, done);
            })
            .then(function () {
              grunt.log.success('You can now start working on the feature! :)');
            })
            .done();

        }
        else if (step === 'finish') {

          helpers.gitCreateAndSwitchBranch(branchName)
            .catch(function (err) {
              grunt.log.debug('Error on gitCreateAndSwitchBranch(' + branchName + ')');
              helpers.failTask(err, done);
            })
            .then(function () {
              return helpers.assignMergeRequest(config.gitlab.mr.doneAssignee);
            })
            .catch(function (err) {
              grunt.log.debug('Error on assignMergeRequest(' + config.gitlab.mr.doneAssignee + ')');
              helpers.failTask(err, done);
            })
            .then(function () {
              return helpers.moveJiraCard(config.jira.statuses.review);
            })
            .catch(function (err) {
              grunt.log.debug('Error on moveJiraCard(' + config.jira.statuses.review + ')');
              helpers.failTask(err, done);
            })
            .then(function () {
              grunt.log.success('The feature is now in the Review process.');
            })
            .done();

        }
        else {
          helpers.failTask(new Error('Task called with step "' + step + '", should be called with one of the following: new, finish.'), done);
        }
      })
      .done();




    /*return;



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

    }*/

  });

};