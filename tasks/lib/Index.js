var Index = function () {
  var Util = require('./Util');

  if (Util.isUsed.git) {
    var Git = require('./Git');
    this.git = new Git();
  }

  if (Util.isUsed.gitlab) {
    var Git = require('./Gitlab');
    this.gitlab = new Gitlab();

    Util.promisesToHandle.unshift(function () {
      this.gitlab.checkConnection()
    });
  }

  if (Util.isUsed.jira) {
    var Jira = require('./Jira');
    this.jira = new Jira();

    Util.promisesToHandle.unshift(function () {
      this.jira.checkConnection()
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
      return function () { fn.call(self.git, step[key].branchName); };
      break;
    case 'git.create.branch':
      return function () { fn.call(self.git, self.git.workingBranch, step[key].with_checkout); };
      break;
    case 'git.pull':
      return function () { fn.call(self.git, step[key].repo, step[key].branch, step[key].with_rebase); };
      break;
    case 'git.push':
      return function () { fn.call(self.git, step[key].repo, step[key].branch) };
      break;
    case 'git.merge':
      return function () { fn.call(self.git, step[key].from, step[key].to); };
      break;
    case 'git.cherrypick':
      return function () { fn.call(self.git, step[key].commit); };
      break;
    default:
        return function () { console.log('DEFAULT'); }; // TODO tmp
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
  "git.cherrypick": { "class": "Git", "method": "cherryPick" }
};

module.exports = new Index();