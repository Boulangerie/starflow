var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');
var starflow = require('../starflow');
var Task = require('../Task');
var Sequence = require('../Sequence');
var spawnFactory = require('../shell/spawn');
var createPRFactory = require('../github/createPR');
var BaseExecutable = require('../Executable');

Promise.promisifyAll(fs);

function CreatePullRequest(helpers, api) {
  BaseExecutable.call(this, 'teads.createPullRequest');
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to CreatePullRequest constructor');
  }
  this.helpers = helpers;
  this.api = api;
}
CreatePullRequest.prototype = Object.create(BaseExecutable.prototype);
CreatePullRequest.prototype.constructor = CreatePullRequest;

CreatePullRequest.prototype.getRepositoryUrl = function getRepositoryUrl(fullPath) {
  var packageJsonPath = path.resolve(path.normalize(fullPath + '/package.json'));
  return fs
    .readFileAsync(packageJsonPath, 'utf8')
    .then(function (data) {
      data = JSON.parse(data);
      return _.get(data, 'repository.url', '');
    });
};

CreatePullRequest.prototype.dummyCommitAndPush = function dummyCommitAndPush(fullPath, branch) {
  var gitCommit = {
    cmd: ['git', 'commit', '--allow-empty', '-m', '[STARFLOW] init'],
    exec: this.createExecutable(spawnFactory)
  };
  var gitPush = {
    cmd: ['git', 'push', '-u', 'origin', branch],
    exec: this.createExecutable(spawnFactory)
  };

  return new Sequence([
    new Task(gitCommit.exec, {
      cmd: _.head(gitCommit.cmd),
      args: _.tail(gitCommit.cmd),
      options: {
        cwd: fullPath
      }
    }, null, gitCommit.cmd.join(' ')),
    new Task(gitPush.exec, {
      cmd: _.head(gitPush.cmd),
      args: _.tail(gitPush.cmd),
      options: {
        cwd: fullPath
      }
    }, null, gitPush.cmd.join(' '))
  ]).run()
};

CreatePullRequest.prototype.createPr = function createPr(fullPath, baseBranch, title, branch) {
  return this.dummyCommitAndPush(fullPath, branch)
    .then(this.getRepositoryUrl.bind(this, fullPath))
    .then(function (repositoryUrl) {
      starflow.logger.debug('Repository URL: ' + repositoryUrl);
      var matches = repositoryUrl.match(/github\.com:(.+)\/(.+)/);
      if (matches) {
        var user = matches[1];
        var repo = matches[2].replace('.git', '');
      } else {
        throw new Error('Could not get Github user and repository for project at "' + fullPath + '"');
      }

      var createPrExec = this.createExecutable(createPRFactory(this.api.github));
      var description = 'Create PR "' + title + '" for "' + user + '/' + repo + '"';
      return new Task(createPrExec, [user, repo, baseBranch, branch, title], null, description).run();
    }.bind(this));
};

CreatePullRequest.prototype.exec = function exec(dependencyPath, branchName, prTitle) {
  if (!prTitle) {
    throw new Error('You must provide PR title (got ' + prTitle + ')');
  }

  var fullPath, baseBranch;
  if (dependencyPath) {
    var dependency = this.helpers.parseDependency(dependencyPath);
    fullPath = this.helpers.generatePath(dependency);
    baseBranch = dependency.baseBranch;
  } else {
    // no dependencyPath -> create PR for current project
    fullPath = path.resolve('.');
    // TODO add a inquirer task before creating the PR to ask the user what is the base branch of the current project
    baseBranch = 'master'; // not always the case (e.g. teads-player with the release/v1 branch)
  }

  return this.createPr(fullPath, baseBranch, prTitle, branchName);
};

module.exports = function (helpers, api) {
  return function () {
    return new CreatePullRequest(helpers, api);
  };
};
