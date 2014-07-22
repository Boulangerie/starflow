'use strict';

exports.init = function (config, grunt, Q, helpers) {
  var exports = {};

  exports.git = {

    checkout: function (args) {
      var deferred = Q.defer();
      deferred.reject(new Error('BOB'));
      return deferred.promise;
    },

    pull: function (args) {
      var deferred = Q.defer();
      deferred.resolve(args);
      return deferred.promise;
    },

    push: function () {
      var deferred = Q.defer();
      deferred.resolve(true);
      return deferred.promise;
    },

    create: {
      branch: function (args) {
        var deferred = Q.defer();
        deferred.resolve(args);
        return deferred.promise;
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

      merge_request: function () {
        var deferred = Q.defer();
        deferred.resolve(true);
        return deferred.promise;
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

    edit: {

      card: function (args) {
        var deferred = Q.defer();
        deferred.resolve(args);
        return deferred.promise;
      }

    }

  };

  return exports;
};