var Util = function () {
  this.isUsed = {
    git: false,
    gitlab: false,
    jira: false
  };

  // config from Gruntfile + credentials
  this.config = {};

  // array of promises corresponding with the steps of the workflow + some verifications
  this.promisesToHandle = [];
};
Util.prototype.constructor = Util;

/**
 * Check if the given key (e.g. 'git.checkout') uses either Git, Gitlab or Jira class
 * @param key {string}
 * @returns {boolean}
 */
Util.prototype.checkRelatedCommand = function (key) {
  var self = this,
      _ = require('lodash'),
      LogService = require('./LogService'),
      gitRegex = /^git/i,
      gitlabRegex = /^gitlab/i,
      jiraRegex = /^jira/i;

  LogService.debug('Util.checkRelatedCommand(' + key + ')');

  if (_.isString(key)) {
    if (gitRegex.test(key)) {
      self.isUsed.git = true;
      return true;
    }
    else if (gitlabRegex.test(key)) {
      self.isUsed.gitlab = true;
      return true;
    }
    else if (jiraRegex.test(key)) {
      self.isUsed.jira = true;
      return true;
    }
    else {
      return false;
    }
  }
  else {
    return false;
  }
};

/**
 * Add a promise to the promisesToHandle array
 * @param step {object}
 */
Util.prototype.registerPromiseForStep = function (step) {
  var self = this,
      _ = require('lodash'),
      Index = require('./Index');

  // convert string to object
  if (_.isString(step)) {
    var o = {};
    o[step.key] = {};
    step = o;
  }

  self.promisesToHandle.push(function () { return Index.get(step); });
};

module.exports = new Util();