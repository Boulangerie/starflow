module.exports = (function (Q, _, colors, common) {
  'use strinct';

  Q.longStackSupport = true;

  _.mixin({
    allUndefinedOrNull: function () {
      var foundUndefinedOrNull = false;
      var i = 0;
      while (i < arguments.length && !foundUndefinedOrNull) {
        if (_.isUndefined(arguments[i]) || _.isNull(arguments[i])) {
          foundUndefinedOrNull = true;
        }
        i++;
      }
      return foundUndefinedOrNull;
    },

    isDefinedNotNull: function (val) {
      return !_.isUndefined(val) && !_.isNull(val);
    },

    isUndefinedOrNull: function (val) {
      return _.isUndefined(val) || _.isNull(val);
    }
  });

  this.config = {};

  var init = function (config) {
    this.config = config;
    
    // if arg given by user is an issue number => prepend 'findIssueKey' to workflow
    if (require('./Jira').isIssueNum(config.jira.issueNum)) {
      this.config.steps.unshift({ 'getJiraIssue': [] });
    }

    if (_.isUndefined(this.config.branchTpl)) {
      this.config.branchTpl = '{{ issueType }}/{{ issueKey }}/{{ issueSlug }}';
    }
    this.config.logDepth = 0;
    
    return this;
  };

  var run = function () {
    return common.runPromisesSequence(this.config)
      .then(function () {
        console.log(' SUCCESS '.black.bgGreen + ' Task finished successfully'.green);
      }, function (err) {
        console.log(' ERROR '.black.bgRed + ' Task aborted due to errors'.red);
        throw err;
      });
  };

  return {
    init: init,
    run: run
  }
})(require('q'), require('lodash'), require('colors'), require('./Common'));