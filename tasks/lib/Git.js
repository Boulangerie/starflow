var Git = function () {

  this.otherBranches = [];
  this.currentBranch = null;
  this.workingBranch = null;

};
Git.prototype.constructor = Git;

/**
 * init method
 * @returns {promise|Q.promise}
 */
Git.prototype.init = function () {
  var self = this,
      Q = require('q'),
      deferred = Q.defer();

  /**
   * Extract branches from 'branches' to populate currentBranch and otherBranches
   * @param branches {array}
   * @returns {Git}
   */
  var _extractBranches = function (branches) {
    var activeBranch;

    for (var i = 0; i < branches.length; i++) {
      activeBranch = branches[i].trim();
      if (activeBranch.match(/\* (.+)/)) { // current branch starts with '*'
        self.currentBranch = activeBranch.replace(/\* /, '');
      }
      else if (activeBranch !== '') {
        self.otherBranches.push(activeBranch);
      }
    }
    return self;
  };

  self
    .getBranches()
    .then(function (branches) {
      _extractBranches(branches);
      deferred.resolve(true);
    });

  return deferred.promise;
};

/**
 * git branch
 * @returns {promise|Q.promise}
 */
Git.prototype.getBranches = function () {
  var Q = require('q'),
      LogService = require('./LogService'),
      exec = require('child_process').exec,
      deferred = Q.defer();

  LogService.debug('START Git.getBranches()');

  exec('git branch', function (err, data) {
    if (!err) {
      deferred.resolve(data.split('\n'));
    }
    else {
      deferred.reject(new Error(err));
    }

    LogService.debug('END   Git.getBranches()');
  });

  return deferred.promise;
};

/**
 * git checkout 'branch'
 * @param branch {string}
 * @returns {promise|Q.promise}
 */
Git.prototype.checkout = function (branch) {
  var self = this,
      Q = require('q'),
      LogService = require('./LogService'),
      exec = require('child_process').exec,
      branch = branch || 'master'; // master by default
      deferred = Q.defer();

  LogService.debug('START Git.checkout(' + branch + ')');

  if (self.currentBranch !== branch) {
    exec('git checkout ' + branch, function (err, data) {
      if (err) {
        deferred.reject(new Error(err));
      }
      else {
        var tmp = self.currentBranch;
        self.currentBranch = branch;
        self.otherBranches.push(tmp);
        // remove branch from otherBranches since it's now the current branch
        if (self.otherBranches.indexOf(branch) !== -1) {
          self.otherBranches.splice(self.otherBranches.indexOf(branch), 1);
        }
        LogService.success('Switched to branch ' + branch + '.');
        deferred.resolve(data);
      }

      LogService.debug('END   Git.checkout(' + branch + ')');
    });
  }
  else {
    deferred.resolve(self.currentBranch);
    LogService.debug('END   Git.checkout(' + branch + ')');
  }

  return deferred.promise;
};

/**
 * git branch 'branch' || git checkout -b 'branch'
 * @param branch {string}
 * @param withCheckout {boolean}
 * @returns {promise|Q.promise}
 */
Git.prototype.createBranch = function (branch, withCheckout) {
  var self = this,
      Q = require('q'),
      exec = require('child_process').exec,
      _ = require('lodash'),
      LogService = require('./LogService'),
      deferred = Q.defer(),
      branchExists = self.currentBranch === branch || _.contains(self.otherBranches, branch),
      gitCmd;

  LogService.debug('START Git.createBranch(' + branch + ', ' + withCheckout + ')');

  if (!_.isString(branch)) {
    deferred.reject(new Error('A branch name is mandatory to create a new branch.\nIf your workflow uses Jira, you must pass in the issue key (--card=MY-CARD).\nElse, pass in the branch name (--branch=MY-WORKING-BRANCH)'));
  }
  else {
    exec('git branch ' + branch, function (err, data) {
      if (err) {
        deferred.reject(new Error(err));
      }
      else {
        if (!branchExists) {
          LogService.success('New branch created: ' + branch + '.');
          self.otherBranches.push(branch);
        }

        if (withCheckout) {
//          LogService.message('Switched to branch ' + branch + '.');
          self
            .checkout(branch)
            .then(function () {
              deferred.resolve(data);
            }, function (err) {
              deferred.reject(err);
            });
        }
        else {
          deferred.resolve(data);
        }
      }

      LogService.debug('END   Git.createBranch(' + branch + ', ' + withCheckout + ')');
    });
  }

  return deferred.promise;
};

/**
 * git merge 'from' 'to'
 * @param from {string}
 * @param to {string}
 * @returns {promise|Q.promise}
 */
Git.prototype.merge = function (from, to) {
  var Q = require('q'),
      exec = require('child_process').exec,
      LogService = require('./LogService'),
      deferred = Q.defer();

  LogService.debug('START Git.merge(' + from + ', ' + to + ')');

  exec('git merge ' + from + ' ' + to, function (err, data) {
    if (err) {
      deferred.reject(new Error(err));
    }
    else {
      LogService.success('Merge branch ' + from + ' to ' + to + '.');
      deferred.resolve(data);
    }

    LogService.debug('END   Git.merge(' + from + ', ' + to + ')');
  });

  return deferred.promise;
};

/**
 * git pull 'repository' 'branch' || git pull --rebase 'repository' 'branch'
 * @param repository {string}
 * @param branch {string}
 * @param withRebase {boolean}
 * @returns {promise|Q.promise}
 */
Git.prototype.pull = function (repository, branch, withRebase) {
  var self = this,
      Q = require('q'),
      exec = require('child_process').exec,
      LogService = require('./LogService'),
      deferred = Q.defer(),
      option = withRebase ? '--rebase ' : '';

  // set default values if params not defined
  repository = repository || 'origin';
  branch = branch || 'master';

  LogService.debug('START Git.pull(' + repository + ', ' + branch + ', ' + withRebase + ')');

  exec('git pull ' + option + repository + ' ' + branch, function (err, data) {
    if (err) {
      deferred.reject(new Error(err));
    }
    else {
      LogService.message('Local branch ' + branch + ' is now up-to-date.');
      deferred.resolve(data);
    }
    LogService.debug('END   Git.pull(' + repository + ', ' + branch + ', ' + withRebase + ')');
  });


  return deferred.promise;
};

/**
 * git push 'repository' 'branch'
 * @param repository {string}
 * @param branch {string}
 * @returns {promise|Q.promise}
 */
Git.prototype.push = function (repository, branch) {
  var Q = require('q'),
      Gitlab = require('Gitlab'),
      exec = require('child_process').exec,
      LogService = require('./LogService'),
      deferred = Q.defer();

  // set default values if params not defined
  repository = repository || 'origin';
  branch = branch || self.workingBranch;

  LogService.debug('START Git.push(' + repository + ', ' + branch + ')');

  Gitlab
    .branchExistsOnRemote(branch)
    .then(function (branchExists) {
      var option = branchExists ? '-u ' : ' ';
      exec('git push ' + option + repository + ' ' + branch, function (err, data) {
        if (err) {
          deferred.reject(new Error(err));
        }
        else {
          LogService.success('Branch ' + branch + ' was pushed to ' + repository + '/' + branch + '.');
          deferred.resolve(data);
        }

        LogService.debug('END   Git.push(' + repository + ', ' + branch + ')');
      });
    });

  return deferred.promise;
};

/**
 * git cherry-pick 'commitHash'
 * @param commitHash {string}
 */
Git.prototype.cherryPick = function (commitHash) {
  var Q = require('q'),
    exec = require('child_process').exec,
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Git.cherryPick(' + commitHash + ')');

  if (_.isUndefined(commitHash)) {
    deferred.reject(new Error('You must specify a Commit SHA1 string as parameter (grunt ttdev(...) --commit=COMMIT_SHA1).'));
  }
  else {
    // remove .git/index.lock
    exec('rm -f .git/index.lock', function (err) {
      if (err) {
        deferred.reject(new Error(err));
      }
      else {
        exec('git cherry-pick ' + commitHash + ' -m 1', function (err) {
          if (err) {
            if (!err.toString().match(/git commit --allow-empty/)) {
              deferred.reject(new Error(err));
            }
            else {
              // if there was the message 'git commit --allow-empty', then there is nothing to cherry-pick
              exec('git reset', function (err) {
                if (err) {
                  deferred.reject(new Error(err));
                }
                else {
                  deferred.resolve(true);
                }
              });
            }
          }
          else {
            deferred.resolve(true);
            LogService.success('Commit ' + commitHash + ' copied to ' + self.currentBranch + '.');
          }

          LogService.debug('END   Git.cherryPick(' + commitHash + ')');
        });
      }
    });
  }

  return deferred.promise;
};

module.exports = Git;