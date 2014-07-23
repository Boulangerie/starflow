'use strict';

exports.init = function (config, grunt, Q, helpers) {
  var exports = {};

  exports.git = {

    checkout: function (args) {
      return helpers.gitCheckout(args.branch);
    },

    pull: function (args) {
      return helpers.gitPull(args.repo, args.branch, args.with_rebase);
    },

    push: function (args) {
      return helpers.gitPush(args.repo, args.branch);
    },

    create: {
      branch: function (args) {
        return helpers.gitCreateBranch(args.branchName || helpers.branchName, args.with_checkout);
      }
    }

  };

  exports.gitlab = {

    check: {

      connection: function () {
        return helpers.checkGitlabConnection();
      }

    },

    create: {

      merge_request: function (args) {
        return helpers.createMergeRequest(args.ref_branch);
      }

    },

    assign: {

      merge_request: function (args) {
        return helpers.assignMergeRequest(args.assignee);
      }

    },

    get: {

      project_id: function (args) {
        return helpers.getGitlabProjectId(args.name);
      }

    }

  };

  exports.jira = {

    check: {

      connection: function () {
        return helpers.checkJiraConnection();
      },

      card: function (args) {
        return helpers.checkJiraCard(args.card);
      }

    },

    move: {

      card: function (args) {
        return helpers.moveJiraCard(args.status);
      }

    },

    get: {

      project_id: function (args) {
        return helpers.getJiraProjectId(args.name);
      }

    }

  };

  return exports;
};