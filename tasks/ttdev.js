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
      typeMatches = { // issue types allowed
        feat: 'feat', feature: 'feat', improvement: 'feat', enhancement: 'feat',
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

    config.typeDev = type;

    // dependencies
    var _ = require('lodash');
    var LogService = require('./lib/LogService').init(grunt);
    var Util = require('./lib/Util');
    Util.config = config;

    // check what commands the steps are using
    // this sets Util.isUsed.X property to true if X is used (X = Git|Gitlab|Jira)
    var commandName;
    for (var i = 0; i < steps.length; i++) {
      commandName = _.isString(steps[i]) ? steps[i] : Object.keys(steps[i])[0];
      Util.checkRelatedCommand(commandName);
    }

    // branch name formed with the type (e.g. feat) and the card (e.g. MAN-123)
    // OR
    // branch name given by the user (with --branch=myBranch) if Jira is not used
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


    //////////////////////////
    // [BEGIN] Reset option //
    //////////////////////////
    if (grunt.option('reset')) {
      var exec = require('child_process').exec;

      exec('git checkout master', function (err) {
        LogService.message('git checkout master');
        if (err) {
          grunt.fail.fatal(err);
        }
        exec('git branch -D ' + branchName, function (err) {
          LogService.message('git branch -D ' + branchName);
          if (err) {
            grunt.fail.fatal(err);
          }

          done();
        });
      });
    }
    //////////////////////////
    // [ END ] Reset option //
    //////////////////////////

    var Index = require('./lib/Index');
    var whenGitReady = Index.git.init();

    // When the Index.git object is done getting the project branches, execute the promises sequentially
    whenGitReady
      .then(function () {

        Index.git.workingBranch = branchName;

        // register all the promises in the Util.promisesToHandle array
        for (var i = 0; i < steps.length; i++) {
          Util.registerPromiseForStep(steps[i]);
        }

        function runPromisesSequence() {
          var sequence;

          // stopping condition
          if (Util.promisesToHandle.length > 0) {

            LogService.debug('Running promises sequence. Remaining promises: ' + Util.promisesToHandle.length);

            // get the first function (wrapper returning a promise) and call it immediately to 'execute the promise'
            // after the promise is resolved, run this recursive function until there is no function left in prmisesToHandle
            sequence = Util.promisesToHandle.shift()()
              .then(runPromisesSequence)
              .catch(function (err) {
                grunt.fail.fatal(err);
                done(false);
              });

            if (Util.promisesToHandle.length === 0) {
              sequence
                .then(function () {
                  LogService.success('---> Task execution complete!');
                  done();
                });
            }
          }

          return sequence;
        }

        runPromisesSequence().done();

      })
      .done();

  });

};