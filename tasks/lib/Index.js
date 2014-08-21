var Index = function () {
  var self = this,
      Util = require('./Util');

  if (Util.isUsed.git) {
    var Git = require('./Git');
    self.git = new Git();
  }

  if (Util.isUsed.gitlab) {
    var Git = require('./Gitlab');
    self.gitlab = new Gitlab();

    Util.promisesToHandle.unshift(function () {
      return self.gitlab.checkConnection();
    });
  }

  if (Util.isUsed.jira) {
    var Jira = require('./Jira');
    self.jira = new Jira();

    Util.promisesToHandle.unshift(function () {
      return self.jira.checkIssue();
    });

    Util.promisesToHandle.unshift(function () {
      return self.jira.checkConnection();
    });
  }

};
Index.prototype.constructor = Index;

/**
 * Get the promise for the given 'step'
 * @param step {object}
 * @return {function}
 */
Index.prototype.get = function (step) {
  var self = this,
      key = Object.keys(step)[0],
      fn = self.getMethodFor(key);

  switch (key) {
    case 'git.checkout':
      return fn.call(self.git, step[key].branchName);
      break;
    case 'git.create.branch':
      return fn.call(self.git, self.git.workingBranch, step[key].with_checkout);
      break;
    case 'git.pull':
      return fn.call(self.git, step[key].repo, step[key].branch, step[key].with_rebase);
      break;
    case 'git.push':
      return fn.call(self.git, step[key].repo, step[key].branch);
      break;
    case 'git.merge':
      return fn.call(self.git, step[key].from, step[key].to);
      break;
    case 'git.cherrypick':
      return fn.call(self.git, step[key].commit);
      break;
    case 'jira.move.card':
      return fn.call(self.jira, step[key].status);
      break;
    default:
        return console.log('DEFAULT'); // TODO tmp
  }
};

/**
 * Get a reference to a method of Git or Gitlab or Jira classes
 * @param key {string}
 * @return {function}
 */
Index.prototype.getMethodFor = function (key) {
  var self = this,
      _  = require('lodash'),
      config;

  if (_.isString(key) && _.contains(Object.keys(self.DSL_MAP), key)) {
    config = self.DSL_MAP[key];
    switch (config.class) {
      case 'Git':
        return self.git[config.method];
        break;
      case 'Gitlab':
        return self.gitlab[config.method];
        break;
      case 'Jira':
        return self.jira[config.method];
        break;
      default:
        throw new Error('The class ' + config.class + ' is undefined');
    }
  }
  else {
    throw new Error('The command ' + key + ' does not exist');
  }
};

Index.prototype.DSL_MAP = {
  "git.checkout": { "class": "Git", "method": "checkout" },
  "git.create.branch": { "class": "Git", "method": "createBranch" },
  "git.pull": { "class": "Git", "method": "pull" },
  "git.push": { "class": "Git", "method": "push" },
  "git.merge": { "class": "Git", "method": "merge" },
  "git.cherrypick": { "class": "Git", "method": "cherryPick" },
  "jira.move.card": { "class": "Jira", "method": "changeStatus" }
};

module.exports = new Index();