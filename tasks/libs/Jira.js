module.exports = (function (_, Q, common) {
  'use strict';

  var Jira = {};

  Jira.isIssueNum = function (num) {
    return _.isDefinedNotNull(num) && /^\d+$/.test(num);
  };

  /**
   * @requires jira.protocol, jira.host, jira.user, jira.pass
   */
  Jira.setApiInstance = function JiraSetApiInstance(input) {
    var deferred = Q.defer();
    var _name = 'Jira.setApiInstance';
    common.logStart(_name, input.logDepth);
    
    if (_.allUndefinedOrNull(input.jira.protocol, input.jira.host, input.jira.user, input.jira.pass)) {
      common.triggerError(_name + ' requires: jira.protocol, jira.host, jira.user, jira.pass', deferred, input.logDepth);
      return deferred.promise;
    }
    else {
      var JiraApi = require('jira').JiraApi;
      try {
        var api = new JiraApi(input.jira.protocol, input.jira.host, input.jira.port || null, input.jira.user, input.jira.pass, 2);
      }
      catch (err) {
        common.triggerError(err);
      }
      api.isShared = true;
      common.triggerSuccess(input, {
        jira: {
          api: api
        }
      }, deferred, input.logDepth);
    }

    return deferred.promise;
  };

  /**
   * @requires jira.projectKey, git.currentBranch
   */
  Jira.findIssueKey = function JiraFindIssueKey(input) {
    var deferred = Q.defer();
    var _name = 'Jira.findIssueKey';
    common.logStart(_name, input.logDepth);

    var haveProjectKeyAndIssueNum = _.isDefinedNotNull(input.jira.projectKey) && _.isDefinedNotNull(input.jira.issueNum);
    var haveCurrentBranch = _.isDefinedNotNull(input.git.currentBranch);

    if (!haveProjectKeyAndIssueNum && !haveCurrentBranch) {
      common.triggerError(_name + ' requires: (jira.projectKey && jira.issueNum) || (git.currentBranch)', deferred, input.logDepth);
      return deferred.promise;
    }

    var issueKey;
    if (Jira.isIssueNum(input.jira.issueNum)) {
      issueKey = input.jira.projectKey + '-' + input.jira.issueNum;
      common.log('Issue key given by user: ' + issueKey);
      common.triggerSuccess(input, {
        jira: {
          issueKey: issueKey
        }
      }, deferred, input.logDepth);
    }
    else { // issueNum not given by user, let's check branch name
      issueKey = common.getIssueKeyFromBranch(input.git.currentBranch);
      if (_.isNull(issueKey)) {
        common.triggerError('Could not find issue key (not given by user and not found in branch name)', deferred, input.logDepth);
      }
      else {
        common.log('Issue key found in branch name: ' + issueKey);
        common.triggerSuccess(input, {
          jira: {
            issueKey: issueKey
          }
        }, deferred, input.logDepth);
      }
    }
    return deferred.promise;
  };
  Jira.findIssueKey.requires = ['getCurrentBranch'];

  /**
   * @requires jira.api
   */
  Jira.getIssue = function JiraGetIssue(input, issueKey) {
    var deferred = Q.defer();
    issueKey = issueKey || input.jira.issueKey;
    var _name = 'Jira.getIssue(' + issueKey + ')';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(input.jira.api)) {
      common.triggerError(_name + ' requires: jira.api', deferred, input.logDepth);
      return deferred.promise;
    }

    if (_.isUndefinedOrNull(issueKey)) {
      common.triggerError('No issue key was provided', deferred, input.logDepth);
      return deferred.promise;
    }

    Q.ninvoke(input.jira.api, 'findIssue', issueKey)
      .then(function (issue) {
        common.log('JIRA issue ' + issueKey + ' was found', input.logDepth);
        common.log('<'+issue.fields.issuetype.name+'> '+issue.fields.summary+' (assigned to '+((!_.isNull(issue.fields.assignee)) ? issue.fields.assignee.name : 'nobody')+')', input.logDepth);
        common.triggerSuccess(input, {
          jira: {
            issue: issue
          }
        }, deferred, input.logDepth);
      }, function (err) {
        common.log('JIRA issue ' + issueKey + ' not found');
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Jira.getIssue.requires = ['setJiraApiInstance', 'findIssueKey'];

  Jira.assignIssue = function JiraAssignIssue(input, assignee, issueKey) {
    var deferred = Q.defer();
    assignee = assignee || input.jira.user || input.jira.assignee;
    issueKey = issueKey || input.jira.issueKey;
    var _name = 'Jira.assignIssue(' + assignee + ', ' + issueKey + ')';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(assignee)) {
      common.triggerError('No assignee username provided', deferred, input.logDepth);
      return deferred.promise;
    }

    if (_.isUndefinedOrNull(issueKey)) {
      common.triggerError('No issue key was provided', deferred, input.logDepth);
      return deferred.promise;
    }

    var params = {
      fields: {
        assignee: {
          name: assignee
        }
      }
    }
    Q.ninvoke(input.jira.api, 'updateIssue', issueKey, params)
      .then(function (data) {
        if (data === 'Success') {
          common.log('JIRA issue ' + issueKey + ' was assigned to ' + assignee, input.logDepth);
          common.triggerSuccess(input, {
            jira: {
              assignee: assignee
            }
          }, deferred, input.logDepth);
        }
        else {
          common.triggerError('There was a problem with the request. Args: ' + issueKey + ', ' + assignee, deferred, input.logDepth);
        }
      }, function (err) {
        common.log('JIRA issue ' + issueKey + ' could not be assigned to ' + assignee + ' (wrong username?)', input.logDepth);
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Jira.assignIssue.requires = ['findIssueKey'];

  Jira.getStatuses = function JiraGetStatuses(input, issueKey) {
    var deferred = Q.defer();
    issueKey = issueKey || input.jira.issueKey;
    var _name = 'Jira.getStatuses(' + issueKey + ')';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(issueKey)) {
      common.triggerError('No issue key was provided', deferred, input.logDepth);
      return deferred.promise;
    }

    Q.ninvoke(input.jira.api, 'listTransitions', issueKey)
      .then(function (data) {
        common.log('Issue statuses found: ' + _.map(data.transitions, function (status) { return status.to.name; }).join(', '), input.logDepth);
        common.triggerSuccess(input, {
          jira: {
            availableStatuses : data.transitions
          }
        }, deferred, input.logDepth);
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Jira.getStatuses.requires = ['findIssueKey'];

  Jira.changeIssueStatus = function JiraChangeIssueStatus(input, status, issueKey) {
    var deferred = Q.defer();
    issueKey = issueKey || input.jira.issueKey;
    var _name = 'Jira.changeIssueStatus(' + status + ', ' + issueKey + ')';
    common.logStart(_name, input.logDepth);

    if (_.isUndefinedOrNull(status)) {
      common.triggerError('No issue status provided', deferred, input.logDepth);
      return deferred.promise;
    }

    if (_.isUndefinedOrNull(issueKey)) {
      common.triggerError('No issue key was provided', deferred, input.logDepth);
      return deferred.promise;
    }

    input.logDepth++;
    common.getPromiseForStep({ 'getJiraIssueStatuses': [] }, input)()
      .then(function (res) {

        input.logDepth--;
        var statuses = res.jira.availableStatuses;
        var issueTransition;
        _.forEach(statuses, function (s) {
          if (s.to.name === status) {
            issueTransition = {
              transition: s
            };
          }
        });

        if (_.isUndefinedOrNull(issueTransition)) {
          common.triggerError('Status "' + status + '" not found on Jira for the issue ' + issueKey, deferred, input.logDepth);
        }
        else {
          Q.ninvoke(input.jira.api, 'transitionIssue', issueKey, issueTransition)
            .then(function (data) {
              common.log('Jira issue ' + issueKey + ' has now the status "' + issueTransition.transition.name + '"', input.logDepth);
              common.triggerSuccess(input, {
                jira: {
                  lastStatus: issueTransition
                }
              }, deferred, input.logDepth);
            }, function (err) {
              common.triggerError(err, deferred, input.logDepth);
            })
            .done();
        }
      }, function (err) {
        common.triggerError(err, deferred, input.logDepth);
      })
      .done();

    return deferred.promise;
  };
  Jira.changeIssueStatus.requires = ['findIssueKey'];

  return Jira;
})(require('lodash'), require('q'), require('./Common'));