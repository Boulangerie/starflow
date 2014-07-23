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

  grunt.registerMultiTask('ttdev', 'Handle the workflow when creating and finishing a feature in a Teads project', function (type, card) {

    // indicates to Grunt that this task uses asynchronous calls
    var done = this.async(),
        config = this.options(),
        allowedCmds = ['git', 'gitlab', 'jira'],
        typeMatches = {
          feat: 'feat', feature: 'feat', improvement: 'feat',
          fix: 'fix', bug: 'fix',
          chore: 'chore', task: 'chore',
          style: 'style',
          refactor: 'refactor', refacto: 'refactor'
        },
        branchName;

    config.gitlab.token = credentials.gitlab.token;
    config.jira.credentials = credentials.jira;

    var helpers = require('./lib/helpers').init(config, grunt, Q);
    var index = require('./lib/index').init(config, grunt, Q, helpers);

    type = typeMatches[(type || grunt.option('type') || config.issue_type || 'feat')];
    card =  card || grunt.option('card') || config.jira.card;
    helpers.branchName = type + '-' + card;

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

    var command, params;
    this.data.steps.reduce(function (sequence, step) {
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
        return runDsl(command, params);

      });
    }, Q.fcall(function () { return true; })
    ).catch(function (err) {
//        grunt.log.fail(err);
        throw err;
        done(false);
      })
      .then(function () {
        grunt.log.success('END');
        done(); // end grunt task
      })
      .done();

  });

};