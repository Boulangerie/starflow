var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var getIssueFactory = require('../jira/getIssue');
var createPRFactory = require('../github/createPR');

function CreatePullRequests(helpers, api) {
  this.helpers = helpers || {};
  this.api = api;
}

CreatePullRequests.prototype.getJiraIssue = function getJiraIssue(key) {
  var issue = _.get(starflow.config, 'jira.issue', {});
  if (issue.key === key) {
    return Promise.resolve(issue);
  } else {
    return new Task(getIssueFactory(this.api.jira)(), key, 'Get the JIRA issue')
      .run()
      .then(function () {
        return _.get(starflow.config, 'jira.issue', {});
      });
  }
};

CreatePullRequests.prototype.createPrOnDependency = function createPrOnDependency(dependency, fullPath, branch, issue) {
  var self = this;
  var initialLoggerState = starflow.logger.level;
  starflow.logger.level = starflow.logger.LEVEL.NORMAL; // to shut the output of `npm show X`
  return new Sequence([
    new Task(spawnFactory(), {
      cmd: 'git',
      args: ['commit', '--allow-empty', '-m', '[STARFLOW] init'],
      options: {
        cwd: fullPath
      }
    }, null, 'git commit --alow-empty -m "[STARFLOW] init"'),
    new Task(spawnFactory(), {
      cmd: 'git',
      args: ['push', '-u', 'origin', branch],
      options: {
        cwd: fullPath
      }
    }, null, 'git push -u origin ' + branch),
    new Task(spawnFactory(), {
      cmd: 'npm',
      args: ['show', '--json', dependency.name],
      options: {
        cwd: fullPath
      }
    }, 'npm show --json ' + dependency.name)
  ])
    .run()
    .then(function () {
      try {
        starflow.logger.level = initialLoggerState;
        var npmShow = JSON.parse(_.get(starflow.config, 'lastShellOutput'));
        var matches = _.get(npmShow, 'repository.url', '').match(/github\.com\/(.+)\/(.+)/);
        if (matches) {
          var user = matches[1];
          var repo = matches[2].replace('.git', '');
          var title = issue.key + ': ' + _.get(issue, 'fields.summary');
        } else {
          throw new Error('Could not get Github user and repository from `npm show ' + dependency.name + '`');
        }
      } catch (err) {
        // error when doing JSON.parse(...) on the output of `npm show X`
        throw err;
      }

      return new Task(createPRFactory(self.api.github)(), [
        user,
        repo,
        dependency.baseBranch,
        branch,
        title
      ]).run();
    })
    .catch(function (err) {
      throw err;
    });
};

CreatePullRequests.prototype.exec = function (key, branch, dependencies) {
  var deps = this.helpers.parseDependencies(dependencies);
  var self = this;

  var promises = _.map(deps, function (dep) {
    var pathName = _.reduce(dep.chain, function (prev, current) {
      return prev + 'node_modules/' + current + '/';
    }, './');
    var fullPath = path.resolve(pathName);

    return self.getJiraIssue(key)
      .then(function (issue) {
        return self.createPrOnDependency(dep, fullPath, branch, issue);
      })
      .catch(function (err) {
        starflow.logger.error('Error when creating the PR for ' + dep.baseBranch + ':' + branch + ' on the ' + dep.fullName + ' dependency');
        throw err;
      });
  });

  return Promise.all(promises);
};

module.exports = function (helpers, api) {
  return function () {
    return new CreatePullRequests(helpers, api);
  };
};
