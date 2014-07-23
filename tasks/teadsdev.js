/**
 * @name teadsdev.js
 * 
 * @copyright 2014 Teads Technology
 */

'use strict';

module.exports = function (grunt) {

  // external libs
  var credentials = require('./credentials');
  var Q = require('q');

  grunt.registerMultiTask('ttdev', 'Handle the workflow when creating and finishing a feature in a Teads project', function (type) {

    // indicates to Grunt that this task uses asynchronous calls
    var done = this.async(),
        // get the options from the Gruntfile config
        config = this.options(),
        // allowed commands pass in the steps config
        allowedCmds = ['git', 'gitlab', 'jira'],
        // issue types allowed
        typeMatches = {
          feat: 'feat', feature: 'feat', improvement: 'feat',
          fix: 'fix', bug: 'fix',
          chore: 'chore', task: 'chore',
          style: 'style',
          refactor: 'refactor', refacto: 'refactor',
          docs: 'docs', doc: 'docs', documentation: 'docs',
          test: 'test', tests: 'test'
        },
      steps = this.data.steps,
      card;

    // upgrade config with user's credentials
    config.gitlab.token = credentials.gitlab.token;
    config.jira.credentials = credentials.jira;

    // external libs
    var helpers = require('./lib/helpers').init(config, grunt, Q);
    var index = require('./lib/index').init(config, grunt, Q, helpers);
    var checkGitlabPromise, checkJiraPromise;

    // upgrade config with project id if "project" is a string
    if (typeof config.gitlab.project === 'string') {
      checkGitlabPromise = index.gitlab.get.project_id({ name: config.gitlab.project }).then(function (id) {
        config.gitlab.projectId = id;
      });
    }
    else {
//      checkGitlabPromise = Q.fcall(function () { return true; });
      config.gitlab.projectId = parseInt(config.gitlab.project);
    }

    if (typeof config.jira.project === 'string') {
      checkJiraPromise = index.jira.get.project_id({ name: config.jira.project }).then(function (id) {
        config.jira.projectId = id;
      });
    }
    else {
//      checkJiraPromise = Q.fcall(function () { return true; });
      config.jira.projectId = parseInt(config.jira.project);
    }

    // issue type
    type = typeMatches[(type || grunt.option('type') || config.issue_type || 'feat')];
    // issue/card key
    card =  grunt.option('card') || config.jira.card;
    // set branchName as {type}-{card}
    helpers.branchName = type + '-' + card;

    // card is mandatory
    if (!card) {
      done(false);
      throw new Error('You must specify a JIRA card name (--card=CARD_NAME while running the task).');
    }

    var runDsl = function (cmd, args) {
      var tmp = cmd.split('.');
      if (allowedCmds.indexOf(tmp[0]) === -1) {
        throw new Error('Command used: ' + tmp[0] + '. Allowed commands: git, gitlab, jira.');
      }
      grunt.log.debug(cmd + '(' + JSON.stringify(args) + ')');
      return eval('index.' + cmd)(args);
    };

    // TODO external lib
    var checkConfigFor = function (cmd) {
      var withHost;

      if (cmd.match(/^gitlab/)) {
        withHost = config.gitlab.host && config.gitlab.host.match(/^http(?:s):\/\/(.+)?/);
        if (!withHost || !config.gitlab.project) {
          grunt.log.debug('config.gitlab', config.gitlab);
          throw new Error('You must specify a host (starting with http(s)) and a project (name or id) in your Gitlab config.');
        }
      }
      else if (cmd.match(/^jira/)) {
        withHost = config.jira.host && config.jira.host.match(/^http(?:s):\/\/(.+)?/);
        if (!withHost || !config.jira.project) {
          grunt.log.debug('config.gitlab', config.jira);
          throw new Error('You must specify a host (starting with http(s)) and a project (name or id) in your JIRA config.');
        }
      }
    };

    Q.all([checkGitlabPromise, checkJiraPromise])
      .then(function () {

        var command, params;
        steps.reduce(function (sequence, step) {
            return sequence.then(function () {

              if (typeof step === 'object') {
                command = Object.keys(step)[0];
                params = step[Object.keys(step)[0]];
              }
              else if (typeof step === 'string') {
                command = step;
                params = {};
              }
              else {
                throw new Error('Step type is ' + (typeof step) + '. Allowed types: object, string.');
              }
              checkConfigFor(command);
              return runDsl(command, params);

            });
          }, Q.fcall(function () { return true; })
        ).catch(function (err) {
            throw err;
            done(false);
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