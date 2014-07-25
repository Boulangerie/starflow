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
        usesJira = false, // true if the workflow uses JIRA, false otherwise
        usesGitlab = false, // true if the workflow uses Gitlab, false otherwise
        card, // JIRA card/issue
        credentials = require(config.credentials_file);

    // upgrade config object with user's credentials
    config.gitlab.token = credentials.gitlab.token;
    config.jira.credentials = credentials.jira;

    // internal libs
    var helpers = require('./lib/helpers').init(config, grunt, Q);
    var index = require('./lib/index').init(config, grunt, Q, helpers);
    var utils = index.utils(grunt, index);

    ///////////////////////////////////////////////////////
    // 1) Convert string steps into object ones          //
    // 2) Checks if the workflow uses Gitlab and/or JIRA //
    ///////////////////////////////////////////////////////

    steps.forEach(function (step, idx) {
      if (typeof step === 'string') {
        // uses jira?
        if (!usesJira && step.matchesJira()) {
          usesJira = true;
        }
        // uses gitlab?
        if (!usesGitlab && step.matchesGitlab()) {
          usesGitlab = true;
        }
        utils.checkIfWorkflowUses(step);
        // convert
        steps[idx] = utils.convertStep(step, 'object');
      }
    });

    ////////////////////////////////////////////////////
    // Check if the host and project are provided if  //
    // the workflow uses Gitlab and/or JIRA platforms //
    ////////////////////////////////////////////////////

    var withHost;
    if (utils.usesGitlab) {
      withHost = config.gitlab.host && config.gitlab.host.match(/^http(?:s):\/\/(.+)?/);
      if (!withHost || !config.gitlab.project) {
        grunt.log.debug('config.gitlab', config.gitlab);
        throw new Error('You must specify a host (starting with http(s)) and a project (name or id) in your Gitlab config.');
      }
    }
    if (utils.usesJira) {
      withHost = config.jira.host && config.jira.host.match(/^http(?:s):\/\/(.+)?/);
      if (!withHost || !config.jira.project) {
        grunt.log.debug('config.gitlab', config.jira);
        throw new Error('You must specify a host (starting with http(s)) and a project (name or id) in your JIRA config.');
      }
    }

    ///////////////////////////////////////////////////
    // Get the ID of the Gitlab and/or JIRA projects //
    ///////////////////////////////////////////////////

    // check connections promises
    var checkGitlabPromise, checkJiraPromise;
    // upgrade config object with gitlab.projectId
    if (typeof config.gitlab.project === 'string') {
      checkGitlabPromise = index.gitlab.get.project_id({ name: config.gitlab.project }).then(function (id) {
        config.gitlab.projectId = id;
      });
    }
    else { // project is already an id
      config.gitlab.projectId = parseInt(config.gitlab.project);
    }

    // upgrade config object with jira.projectId
    if (typeof config.jira.project === 'string') {
      checkJiraPromise = index.jira.get.project_id({ name: config.jira.project }).then(function (id) {
        config.jira.projectId = id;
      });
    }
    else { // project is already an id
      config.jira.projectId = parseInt(config.jira.project);
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

    // card is mandatory
    if (usesJira && !card) {
      done(false); // fail grunt task
      throw new Error('You must specify a JIRA card name (--card=CARD_NAME while running the ttdev task).');
    }

    ////////////////////////////////////////////////////////
    // Run each step of the workflow of te current target //
    ////////////////////////////////////////////////////////

    // wait to have the projectID of Gitlab and/or Jira before running the steps
    Q.all([checkGitlabPromise, checkJiraPromise])
      .then(function () {

        var command, params;
        steps.reduce(function (sequence, step) {
            return sequence.then(function () {

              if (typeof step === 'object') {
                command = Object.keys(step)[0];
                params = step[Object.keys(step)[0]];
              }
              else {
                throw new Error('Step type is ' + (typeof step) + '. Allowed types: object, string.');
              }
              return utils.parseAndRun(command, params, allowedCmds);

            });
          }, Q.fcall(function () { return true; })
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

  });

};