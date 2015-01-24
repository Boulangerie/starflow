module.exports = (function (_, Q) {
  'use strict';

  var Common = {};

  Common.associationStepFn = {
    setJiraApiInstance: { namespace: 'Jira', method: 'setApiInstance' },
    setGitApiInstance: { namespace: 'Git', method: 'setApiInstance' },
    setGitlabApiInstance: { namespace: 'Gitlab', method: 'setApiInstance' },
    getCurrentBranch: { namespace: 'Git', method: 'getCurrentBranch' },
    gitCheckout: { namespace: 'Git', method: 'checkout' },
    getDevBranchName: { namespace: 'Git', method: 'getDevBranchName' },
    gitFetch: { namespace: 'Git', method: 'fetch' },
    gitRebase: { namespace: 'Git', method: 'rebase' },
    gitPush: { namespace: 'Git', method: 'push' },
    createBranch: { namespace: 'Git', method: 'createBranch' },
    findIssueKey: { namespace: 'Jira', method: 'findIssueKey' },
    getJiraIssue: { namespace: 'Jira', method: 'getIssue' },
    assignJiraIssue: { namespace: 'Jira', method: 'assignIssue' },
    getJiraIssueStatuses: { namespace: 'Jira', method: 'getStatuses' },
    changeJiraIssueStatus: { namespace: 'Jira', method: 'changeIssueStatus' },
    getGitlabProject: { namespace: 'Gitlab', method: 'getProject' },
    getMergeRequestBetween: { namespace: 'Gitlab', method: 'getMergeRequestBetween' },
    getGitlabUser: { namespace: 'Gitlab', method: 'getUserWithUsername' },
    createMergeRequest: { namespace: 'Gitlab', method: 'createMergeRequest' },
    assignMergeRequest: { namespace: 'Gitlab', method: 'assignMergeRequest' }
  };

  Common.log = function (message, depth, type, withError) {
    var padding = '    '; // padding inside block
    var paddingTick = '    '; // padding for each depth level

    var computePaddingTick = function () {
      var tick = depth;
      var str = '';
      for (var i = 0; i < tick; i++) {
        str += paddingTick;
      }
      return str;
    };

    switch (type) {
      case 'start':
        console.log('%s%s {'.grey, computePaddingTick(), message);
        break;
      case 'end':
        if (withError) {
          console.log('%s}'.grey + ' ✗'.red, computePaddingTick());
        }
        else {
          console.log('%s}'.grey + ' ✓'.green, computePaddingTick());
        }
        break;
      default:
        console.log('%s%s%s', padding, computePaddingTick(), message);
    }
  };

  Common.logStart = function (message, depth) {
    depth = depth || 0;
    Common.log(message, depth, 'start');
  };

  Common.logEnd = function (withError, depth) {
    depth = depth || 0;
    Common.log(null, depth, 'end', withError);
  };

  Common.triggerError = function (message, deferred, depth) {
    Common.logEnd(true, depth);
    if (!_.isDefinedNotNull(deferred)) {
      deferred.reject(new Error(message));
    }
    else {
      throw new Error(message);
    }
  };

  Common.triggerSuccess = function (dataStream, newData, deferred, depth) {
    Common.logEnd(null, depth);
    var data = _.merge(dataStream, newData);
    if (_.isDefinedNotNull(deferred)) {
      deferred.resolve(data);
    }
    else {
      return data;
    }
  }

  Common.getIssueKeyFromBranch = function (branch) {
    var match = branch.match(/[A-Za-z]+-\d+/);
    return _.isNull(match) ? null : match[0];
  };

  Common.generateDevBranchName = function (branchTpl, mapBranchTpl) {
    return branchTpl.replace(/\{\{\s*issueType\s*\}\}/, mapBranchTpl.issueType)
                    .replace(/\{\{\s*issueKey\s*\}\}/, mapBranchTpl.issueKey)
                    .replace(/\{\{\s*issueSlug\s*\}\}/, mapBranchTpl.issueSlug)
                    .replace(/^\//, '')
                    .replace(/\/$/, '');
  };

  // Common.splitBranchName = function (branch, branchTpl) {
  //   var mapReplace = {
  //     issueType: '([a-z-]+)',
  //     issueKey: '([A-Za-z]+-\\d+)',
  //     issueSlug: '([a-z-]+)'
  //   };
  //   var regexStr = branchTpl.replace(/\{\{\s*issueType\s*\}\}/, mapReplace.issueType)
  //                           .replace(/\{\{\s*issueKey\s*\}\}/, mapReplace.issueKey)
  //                           .replace(/\{\{\s*issueSlug\s*\}\}/, mapReplace.issueSlug);
  //   var regex = new RegExp(regexStr);
  //   console.log(regexStr);
  //   console.log(branch.match(regex));
  // };

  Common.getPromiseForStep = function (step, previousResult) {
    var stepName = Object.keys(step)[0];
    var stepArgs = step[stepName];
    if (_.isUndefined(this.associationStepFn[stepName])) {
      throw new Error('The step "' + stepName + '" has not been implemented yet');
    }

    var namespace = this.associationStepFn[stepName].namespace;
    var method = this.associationStepFn[stepName].method;
    var service = require('./' + namespace);

    if (!_.isFunction(service[method])) {
      throw new Error('Method "' + method + '" is not available in namespace "' + namespace + '"');
    }

    // clone deep on each object except the ones that have the property isShared to true
    stepArgs.unshift(_.cloneDeep(previousResult, function (val) {
      return (_.isObject(val) && val.isShared) ? val : undefined;
    }));
    return function promiseForStepWrapper() {
      return service[method].apply(null, stepArgs);
    };
  };

  Common.runPromisesSequence = function (config, withControl) {
    var steps = config.steps;
    var self = this;

    withControl = _.isUndefinedOrNull(withControl) ? true : withControl;

    var initial = function () {
      //console.log('[START] Running promises sequence (%d promises registered)'.cyan, steps.length);
      return config;
    };

    var final = function (res) {
      //console.log('[END]   Running promises sequence (%d promises registered)'.cyan, steps.length);
      return res;
    };

    if (withControl) {
      // add required steps before the ones that need them
      var controlSteps = function () {
        for (var i = 0; i < steps.length; i++) {
          var current = steps[i];
          if (i >= 0) {
            var stepName = Object.keys(current)[0];
            if (_.isUndefinedOrNull(self.associationStepFn[stepName])) {
              throw new Error('The step "' + stepName + '" is not supported by this task');
            }
            var namespace = self.associationStepFn[stepName].namespace;
            var method = self.associationStepFn[stepName].method;
            var service = require('./' + namespace);
            var required = service[method].requires || [];
            var stepsNamesBeforeCurrent = _.filter(steps, function (val, index) { return index < i; }).map(function (val) { return Object.keys(val)[0]; });

            var backTick = 0;
            _.forEach(required, function (stepName) {
              if (stepsNamesBeforeCurrent.indexOf(stepName) === -1) {
                var obj = {};
                obj[stepName] = [];
                steps.splice(i, 0, obj);
                backTick++;
              }
            });
            i -= backTick;
          }
        }
      };

      controlSteps(); // modifies steps var to add required steps that were not present in steps
    }

    // magic trick!
      return steps.reduce(function (prev, current, index) {
        // current = step = { 'stepName': [] }
        return prev.then(function (res) {
          return self.getPromiseForStep(current, res)();
        });
      }, Q.fcall(initial)).then(final);
  };

  return Common;
})(require('lodash'), require('q'));