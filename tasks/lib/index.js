'use strict';

exports.init = function (config, grunt, Q, helpers) {
  var exports = {};

  exports.git = {

    checkout: function (args) {
      return helpers.gitCheckout(args.branch).catch(function (err) { grunt.log.fail('[Git Error]'); throw err; });
    },

    pull: function (args) {
      return helpers.gitPull(args.repo, args.branch, args.with_rebase).catch(function (err) { grunt.log.fail('[Git Error]'); throw err; });
    },

    push: function (args) {
      return helpers.gitPush(args.repo, args.branch).catch(function (err) { grunt.log.fail('[Git Error]'); throw err; });
    },

    create: {
      branch: function (args) {
        return helpers.gitCreateBranch(args.branchName || helpers.branchName, args.with_checkout).catch(function (err) { grunt.log.fail('[Git Error]'); throw err; });
      }
    }

  };

  exports.gitlab = {

    check: {

      connection: function () {
        return helpers.checkGitlabConnection().catch(function (err) { grunt.log.fail('[Gitlab Error]'); throw err; });
      }

    },

    create: {

      merge_request: function (args) {
        return helpers.createMergeRequest(args.ref_branch).catch(function (err) { grunt.log.fail('[Gitlab Error]'); throw err; });
      }

    },

    assign: {

      merge_request: function (args) {
        return helpers.assignMergeRequest(args.assignee).catch(function (err) { grunt.log.fail('[Gitlab Error]'); throw err; });
      }

    },

    get: {

      project_id: function (args) {
        return helpers.getGitlabProjectId(args.name).catch(function (err) { grunt.log.fail('[Gitlab Error]'); throw err; });
      }

    }

  };

  exports.jira = {

    check: {

      connection: function () {
        return helpers.checkJiraConnection().catch(function (err) { grunt.log.fail('[JIRA Error]'); throw err; });
      },

      card: function (args) {
        return helpers.checkJiraCard(args.card).catch(function (err) { grunt.log.fail('[JIRA Error]'); throw err; });
      }

    },

    move: {

      card: function (args) {
        return helpers.moveJiraCard(args.status).catch(function (err) { grunt.log.fail('[JIRA Error]'); throw err; });
      }

    },

    get: {

      project_id: function (args) {
        return helpers.getJiraProjectId(args.name).catch(function (err) { grunt.log.fail('[JIRA Error]'); throw err; });
      }

    }

  };

  return exports;
};