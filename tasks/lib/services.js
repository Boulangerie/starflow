module.exports = (function (Q, _, common) {
  'use strinct';

  ///////////////////////////
  // Services declarations //
  ///////////////////////////
  function Utils() {}
  Utils.label = 'utils';
  Utils.prototype.findIssueKey = function () {
    /////////////////
    // Logs config //
    /////////////////
    var logStr = 'Utils.findIssueKey';
    var logArgs = [].slice.call(arguments).join(', ');
    var fnStr = logStr + '(' + logArgs + ')';
    common.start(fnStr);

    ///////////
    // Start //
    ///////////
    var deferred = Q.defer();
    var self = this;

    if (common.isNumber(common.store.jira.issueNum)) {
      var issueKey = common.store.jira.projectKey + '-' + common.store.jira.issueNum;
      console.log('%s  JIRA issue number provided by user: %s. Issue key generated: %s'.green, common.logPadding, common.store.jira.issueNum, issueKey);
      deferred.resolve({
        name: 'config.jira.issueKey',
        value: issueKey
      });
      common.end(fnStr);
    }
    else { // issue number not provided by user, see if it's in the branch name
      var steps = ['getCurrentBranch'];
      common.getStepPromise(steps, 0)()
        .then(function (branch) {
          var match = branch.match(new RegExp('(' + common.store.jira.projectKey + '-\\d+)'));
          if (match) {
            common.store.jira.issueKey = match[0];
            console.log('%s  JIRA issue key not provided by user but found in branch name: %s'.green, common.logPadding, common.store.jira.issueKey);
            deferred.resolve(match[0]);
            common.end(fnStr);
          }
          else {
            var err = new Error('No issue number provided and not found in current branch name (' + branch + ')');
            err.source = fnStr;
            deferred.reject(err);
            common.end(fnStr, true);
          }
        }, function (err) {
          deferred.reject(err); // err is already an error built in Git.getCurrentBranch
          common.end(fnStr, true);
        })
        .done();
    }
    return deferred.promise;
  };



  function Jira() {
    var Api = require('jira').JiraApi;
    this.api = new Api(common.store.jira.protocol, common.store.jira.host, null, common.store.jira.user, common.store.jira.pass, 'latest');

    common.store.steps.unshift('findIssueKey');
  }
  Jira.label = 'jira'; // name property cannot be overriden
  Jira.prototype.getIssue = function (issueKey) {
    /////////////////
    // Logs config //
    /////////////////
    var logStr = 'getJiraIssue';
    var logArgs = [].slice.call(arguments).join(', ');
    var fnStr = logStr + '(' + logArgs + ')';
    common.start(fnStr);

    ///////////
    // Start //
    ///////////
    var deferred = Q.defer();
    var key = issueKey || common.store['config.jira.issueKey'];

    if (_.isUndefined(key)) {
      var err = new Error('Cannot get issue because issue key is undefined');
      err.source = fnStr;
      deferred.reject(err);
      common.end(fnStr, true);
    }
    else { // key is defined
      Q.ninvoke(this.api, 'findIssue', key)
        .then(function (issue) {
          console.log('%s  JIRA issue %s was found'.green, common.logPadding, key);
          console.log('%s  <%s> %s (assigned to %s)', common.logPadding, issue.fields.issuetype.name, issue.fields.summary, (!_.isNull(issue.fields.assignee)) ? issue.fields.assignee.name : 'nobody');

          common.end(fnStr);
          deferred.resolve({
            name: 'issue_' + issue.key,
            description: 'JIRA issue object for ' + issue.key,
            value: issue
          });
        }, function (err) {
          console.log('%s  JIRA issue %s not found'.red, common.logPadding, key);
          err = new Error(err);
          err.source = fnStr;
          deferred.reject(err);
          common.end(fnStr, true);
        })
        .done();
    }
    return deferred.promise;
  };



  function Git() {
    var gitty = require('gitty');
    var exec = Q.denodeify(require('child_process').exec);

    this.api = gitty('.');
  }
  Git.label = 'git';
  Git.prototype.getCurrentBranch = function () {
    var logStr = 'Git.getCurrentBranch';
    var logArgs = [].slice.call(arguments).join(', ');
    var fnStr = logStr + '(' + logArgs + ')';
    common.start(fnStr);

    var deferred = Q.defer();

    // TMP
    deferred.resolve('feat/MAN-777/translations');
    console.log('%s  Current branch: feat/MAN-777/translations', common.logPadding);
    common.end(fnStr);

    /*Q.ninvoke(this.api, 'getBranches')
      .then(function (branches) {
        console.log('branches', branches);
        console.log('Current branch: %s'.grey, branches.current);
        deferred.resolve(branches.current);
        Utils.end(fnStr);
      }, function gitGetBranchesError(err) {
        err.source = fnStr;
        deferred.reject(err);
        Utils.end(fnStr, true);
      })
      .done();*/
    return deferred.promise;
  };

  // public properties and methods
  return {
    Utils: Utils,
    Jira: Jira,
    Git: Git
  };

})(require('q'), require('lodash'), require('./common'));