var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var getIssueFactory = require('../jira/getIssue');
var createPRFactory = require('../github/createPR');
var BaseExecutable = require('../BaseExecutable');

function CreatePullRequests(parentNamespace, helpers, api) {
  BaseExecutable.call(this, 'teads.createPullRequests', parentNamespace);
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to CreatePullRequests constructor');
  }
  this.helpers = helpers;
  this.api = api;
}
CreatePullRequests.prototype = Object.create(BaseExecutable.prototype);
CreatePullRequests.prototype.constructor = CreatePullRequests;

CreatePullRequests.prototype.getJiraIssue = function getJiraIssue(key) {
  if (!key) {
    return Promise.resolve({});
  }
  var issue = this.storage.getLast('jira.getIssue/issue', {});
  if (issue.key === key) {
    return Promise.resolve(issue);
  } else {
    var getJiraIssueInstance = getIssueFactory(this.api.jira)(this.namespace);
    return new Task(getJiraIssueInstance, key, 'Get the JIRA issue')
      .run()
      .then(function () {
        return getJiraIssueInstance.storage.get('issue', {});
      }.bind(this));
  }
};

CreatePullRequests.prototype.createPrOnDependency = function createPrOnDependency(dependency, fullPath, branch, title) {
  var self = this;
  var initialLoggerState = starflow.logger.level;
  starflow.logger.level = starflow.logger.LEVEL.NORMAL; // to shut the output of `npm show X`
  var npmShowInstance = spawnFactory(this.namespace);
  return new Sequence([
    new Task(spawnFactory(this.namespace), {
      cmd: 'git',
      args: ['commit', '--allow-empty', '-m', '[STARFLOW] init'],
      options: {
        cwd: fullPath
      }
    }, null, 'git commit --alow-empty -m "[STARFLOW] init"'),
    new Task(spawnFactory(this.namespace), {
      cmd: 'git',
      args: ['push', '-u', 'origin', branch],
      options: {
        cwd: fullPath
      }
    }, null, 'git push -u origin ' + branch),
    new Task(npmShowInstance, {
      cmd: 'npm',
      args: ['show', '--json', dependency.name],
      options: {
        cwd: fullPath
      }
    }, null, 'npm show --json ' + dependency.name)
  ])
    .run()
    .then(function () {
      try {
        starflow.logger.level = initialLoggerState;
        var npmShow = JSON.parse(npmShowInstance.storage.get('lastShellOutput'));
      } catch (err) {
        // error when doing JSON.parse(...) on the output of `npm show X`
        throw err;
      }

      var matches = _.get(npmShow, 'repository.url', '').match(/github\.com\/(.+)\/(.+)/);
      if (matches) {
        var user = matches[1];
        var repo = matches[2].replace('.git', '');
      } else {
        throw new Error('Could not get Github user and repository from `npm show ' + dependency.name + '`');
      }

      return new Task(createPRFactory(self.api.github)(), [
        user,
        repo,
        dependency.baseBranch,
        branch,
        title
      ]).run();
    }.bind(this));
};

CreatePullRequests.prototype.exec = function (key, prTitle, branch, dependencies) {
  if (!key && !prTitle) {
    throw new Error('You must give either a JIRA issue key or a pull-request title (got key=' + key + ' and prTitle=' + prTitle + ')');
  }

  var deps = this.helpers.parseDependencies(dependencies);
  var self = this;

  var promises = _.map(deps, function (dep) {
    var pathName = _.reduce(dep.chain, function (prev, current) {
      return prev + 'node_modules/' + current + '/';
    }, './');
    var fullPath = path.resolve(pathName);

    if (key) {
      // TODO do not use harcoded Executable names...
      var issue = this.storage.get('jira.getIssue/issue');
      // var issue = _.get(starflow.config, 'jira.getIssue/issue');
      // if we have an issue, override the prTitle anyway
      prTitle = issue.key + ': ' + _.get(issue, 'fields.summary');
    } // if no key was given, then a prTitle was given
    return self.createPrOnDependency(dep, fullPath, branch, prTitle)
      .catch(function (err) {
        starflow.logger.error('Error when creating the PR for ' + dep.baseBranch + ':' + branch + ' on the ' + dep.fullName + ' dependency');
        throw err;
      });
  });

  return this.getJiraIssue(key)
    .then(function () {
      return Promise.all(promises);
    });
};

module.exports = function (helpers, api) {
  return function (parentNamespace) {
    return new CreatePullRequests(parentNamespace, helpers, api);
  };
};
