/**
 * @name teadsdev.js
 * 
 * @copyright 2014 Teads Technology
 */

'use strict';

module.exports = function (grunt) {

  // external libs
  var Q = require('q');

  grunt.registerMultiTask('ttdev', 'Handle the workflow when creating and finishing a feature in a Teads project', function (type) {

    var done = this.async(), // indicates to Grunt that this task uses asynchronous calls
      config = this.options(), // get the options from the Gruntfile config
      allowedCmds = ['git', 'gitlab', 'jira'], // allowed commands pass in the steps config
      typeMatches = { // issue types allowed
        feat: 'feat', feature: 'feat', improvement: 'feat',
        fix: 'fix', bug: 'fix',
        chore: 'chore', task: 'chore',
        style: 'style',
        refactor: 'refactor', refacto: 'refactor',
        docs: 'docs', doc: 'docs', documentation: 'docs',
        test: 'test', tests: 'test'
      },
      steps = this.data.steps, // list of the workflow's steps
      type = typeMatches[(type || grunt.option('type') || config.issue_type || 'feat')],
      branch = grunt.option('branch'),
      card = grunt.option('card') || config.jira.card; // JIRA card/issue

    // upgrade config object with user's credentials
    config.gitlab.token = process.env.GITLAB_PRIVATE_TOKEN;
    config.jira.credentials = {
      user: process.env.JIRA_USERNAME,
      password: process.env.JIRA_PASSWORD
    };

    // dependencies
    var Q = require('q');
    var _ = require('lodash');
    var LogService = require('./lib/LogService').init(grunt);
    var Util = require('./lib/Util');
    Util.config = config;

    // check what commands the steps are using
    for (var i = 0; i < steps.length; i++) {
      Util.checkRelatedCommand(Object.keys(steps[i])[0]);
    }

    var branchName;

    if (Util.isUsed.jira) {
      if (!_.isUndefined(card)) {
        Util.config.jira.issueKey = card;
        branchName = type + '-' + card;
      }
      else {
        grunt.fail.fatal('The Jira issue/card key is mandatory because your workflow uses Jira (run the command with --card=MY-CARD)');
        done(false);
      }
    }
    else {
      if (!_.isUndefined(branch)) {
        branchName = branch;
      }
      else {
        grunt.fail.fatal('Your workflow does not use Jira. You must specify a branch name (run the command with --branch=MY-WORKING-BRANCH)');
        done(false);
      }
    }


    /*
     * start RESET
     */
    if (grunt.option('reset')) {
      var exec = require('child_process').exec;

      exec('git checkout refactor-architecture', function (err) {
        LogService('git checkout refactor-architecture');
        if (err) {
          grunt.fail.fatal(err);
        }
        exec('git branch -D ' + branchName, function (err) {
          LogService('git branch -D ' + branchName);
          if (err) {
            grunt.fail.fatal(err);
          }
        });
      });

      done();
    }
    /*
     * end RESET
     */


    // TMP TMP TMP
    Util.config.jira.projectId = 11205;

    var Index = require('./lib/Index');
    var whenGitReady = (Util.isUsed.git) ? Index.git.init() : true;

    Index.git.workingBranch = branchName;

    // register all the promises in the Util.promisesToHandle array
    for (var i = 0; i < steps.length; i++) {
      Util.registerPromiseForStep(steps[i]);
    }

    whenGitReady
      .then(function () {

        function runPromisesSequence() {
          // stopping assertion
          if (Util.promisesToHandle.length > 0) {

            if (Util.promisesToHandle.length > 1) {
              // pop the first promiseWrapper function of the array Util.promisesToHandle
              // and call it immediately to 'execute the promise'
              return Util.promisesToHandle.shift()()
                .then(runPromisesSequence)
                .catch(function (err) {
                  grunt.fail.fatal(err);
                  done(false);
                });
            }
            else { // length === 1
              // pop the first promiseWrapper function of the array Util.promisesToHandle
              // and call it immediately to 'execute the promise'
              return Util.promisesToHandle.shift()()
                .then(runPromisesSequence)
                .catch(function (err) {
                  grunt.fail.fatal(err);
                  done(false);
                })
                .then(function () {
                  LogService.success('Task execution complete!');
                });
            }
          }
        }

        runPromisesSequence();

      })
      .done();

    return;

    var helpers = require('./lib/helpers').init(config, grunt, Q);
    var index = require('./lib/index').init(config, grunt, Q, helpers);
    var utils = index.utils(grunt, index);

    ///////////////////////////////////////////////////////
    // 1) Convert string steps into object ones          //
    // 2) Checks if the workflow uses Gitlab and/or JIRA //
    ///////////////////////////////////////////////////////

    steps.forEach(function (step, idx) {
      grunt.log.debug('utils.checkIfWorkflowUses(' + JSON.stringify(step) + ')');
      utils.checkIfWorkflowUses(step);
      if (typeof step === 'string') {
        steps[idx] = utils.convertStep(step, 'object');
      }
    });
    grunt.log.debug('usesJIRA = ' + utils.usesJira, '\nusesGitlab = ' + utils.usesGitlab);

    ////////////////////////////////////////////////////
    // Check if the host and project are provided if  //
    // the workflow uses Gitlab and/or JIRA platforms //
    ////////////////////////////////////////////////////

    var withHost, checkGitlabConnectionPromise, checkJiraConnectionPromise;
    if (utils.usesGitlab) {

      // check Gitlab connection if workflow uses Gitlab
      checkGitlabConnectionPromise = utils.parseAndRun('gitlab.check.connection', {}, allowedCmds)
        .catch(function (err) {
          throw err;
          done(false); // fail grunt task
        })
        .then(function () {
          withHost = config.gitlab.host && config.gitlab.host.match(/^http(?:s):\/\/(.+)?/);
          if (!withHost || !config.gitlab.project) {
            grunt.log.debug('config.gitlab', config.gitlab);
            throw new Error('You must specify a host (starting with http(s)) and a project (name or id) in your Gitlab config.');
          }
        });
    }

    if (utils.usesJira) {

      // check JIRA connection if workflow uses JIRA
      checkJiraConnectionPromise = utils.parseAndRun('jira.check.connection', {}, allowedCmds)
        .catch(function (err) {
          throw err;
          done(false); // fail grunt task
        })
        .then(function () {
          withHost = config.jira.host && config.jira.host.match(/^http(?:s):\/\/(.+)?/);
          if (!withHost || !config.jira.project) {
            grunt.log.debug('config.gitlab', config.jira);
            throw new Error('You must specify a host (starting with http(s)) and a project (name or id) in your JIRA config.');
          }
        });

    }

    ///////////////////////////////////////////////////
    // Set up type, card, branch name and check if   //
    // JIRA card is provided if JIRA is used         //
    ///////////////////////////////////////////////////

    // issue type (e.g. feat)
    type = typeMatches[(type || grunt.option('type') || config.issue_type || 'feat')];
    // issue/card key (e.g. MAN-123)
    card =  grunt.option('card') || config.jira.card;

    // set branchName as {type}-{card}
    var format = '%type%-%card%'; // maybe put it in config?
    helpers.branchName = format.replace(/%type%/, type).replace(/%card%/, card);
    helpers.typeDev = type;

    // card is mandatory
    var checkJiraCardPromise;
    if (utils.usesJira) {
      if (!card) {
        done(false); // fail grunt task
        throw new Error('You must specify a JIRA card name (--card=CARD_NAME while running the ttdev task).');
      }
      else {
        checkJiraCardPromise = index.jira.check.card({ card: card })
          .catch(function (err) {
            throw err;
            done(false); // fail grunt task
          });
      }
    }

    ////////////////////////////////////////////////////////
    // Run each step of the workflow of te current target //
    ////////////////////////////////////////////////////////

    // wait to be sure the API(s) are reachable with user's credentials
    Q.all([checkGitlabConnectionPromise, checkJiraConnectionPromise, checkJiraCardPromise])
      .then(function () {

        ///////////////////////////////////////////////////
        // Get the ID of the Gitlab and/or JIRA projects //
        ///////////////////////////////////////////////////

        var checkGitlabProjectPromise, checkJiraProjectPromise;
        if (utils.usesGitlab) {
          // upgrade config object with gitlab.projectId
          if (typeof config.gitlab.project === 'string') {
            checkGitlabProjectPromise = index.gitlab.get.project_id({ name: config.gitlab.project }).then(function (id) {
              config.gitlab.projectId = id;
            });
          }
          else { // project is already an id
            config.gitlab.projectId = parseInt(config.gitlab.project);
          }
        }

        if (utils.usesJira) {
          // upgrade config object with jira.projectId
          if (typeof config.jira.project === 'string') {
            checkJiraProjectPromise = index.jira.get.project_id({ name: config.jira.project }).then(function (id) {
              config.jira.projectId = id;
            });
          }
          else { // project is already an id
            config.jira.projectId = parseInt(config.jira.project);
          }
        }

        // wait to have the projectID of Gitlab and/or Jira before running the steps
        Q.all([checkGitlabProjectPromise, checkJiraProjectPromise])
          .then(function () {

            var command, params;
            steps.reduce(function (sequence, step) {
                return sequence.then(function () {

                  // at this point, every "string" command has been parsed to "object" command
                  if (typeof step === 'object') {
                    command = Object.keys(step)[0];
                    params = step[Object.keys(step)[0]];
                  }
                  else {
                    throw new Error('Step type is ' + (typeof step) + '. Should be "object".');
                  }
                  return utils.parseAndRun(command, params, allowedCmds);

                });
              }, Q.fcall(function () {
                return true;
              })
            ).catch(function (err) {
                throw err;
                done(false); // fail grunt task
              })
              .then(function () {
                grunt.log.success('SUCCESS');
                done(); // end grunt task
              })
              .done();

          })
          .done();

      })
      .done();

  });

};