/**
 * namespace with the service setters
 * @type {Object}
 */
var _setters = {
  /**
   * Git service
   * @param  {ServiceManager} servicesManager
   */
  git: function (servicesManager) {
    var config = servicesManager.config;
    var Q = require('q');
    var Service = require('./Service');
    var self = servicesManager;
    var gitty = require('gitty');
    var exec = Q.denodeify(require('child_process').exec);

    var api = gitty('.');
    servicesManager.services['git'] = new Service('git', servicesManager, api);
    // register commands
    servicesManager.services['git']
      .registerCommand('checkout', function (args) {
        var branch = args.branch || 'master';
        console.log('START - git.checkout(%s)'.grey, branch);
        return Q.ninvoke(self.services.git.api, 'checkout', branch)
          .then(function (data) { console.log('  END - git.checkout(%s)'.grey, branch); return data; });
      })
      .registerCommand('pull', function (args) {
        console.log('START - git.pull(%s, %s, %s)'.grey, args.remote, args.branch, 'rebase=' + ((args.withRebase) ? 'true' : 'false'));
        var remote = args.remote || 'origin';
        var branch = args.branch || 'master';
        var options = args.withRebase ? '--rebase ' : '';

        return exec('git pull ' + options + remote + ' ' + branch)
          .then(function (data) { console.log('  END - git.pull(%s, %s, %s)'.grey, remote, branch, 'rebase=' + ((args.withRebase) ? 'true' : 'false')); return data; });
      })
      .registerCommand('push', function (args) {
        var remote = args.remote || 'origin';
        console.log('START - git.push(%s, %s)'.grey, remote, config.branchName);
        return Q.ninvoke(self.services.git.api, 'push', remote, config.branchName)
          .then(function (data) { console.log('  END - git.push(%s, %s)'.grey, remote, config.branchName); return data; });
      })
      .registerCommand('createBranch', function (args) {
        console.log('START - git.createBranch(%s)'.grey, config.branchName);
        return Q.ninvoke(self.services.git.api, 'createBranch', config.branchName)
          .catch(function (err) {
            if (!/already exists/.test(err)) {
              throw err;
            }
          })
          .then(Q.ninvoke(self.services.git.api, 'checkout', config.branchName))
          .then(function (data) { console.log('  END - git.createBranch(%s)'.grey, config.branchName); return data; });
      });
  },
  /**
   * Gitlab service
   * @param  {ServiceManager} servicesManager
   */
  gitlab: function (servicesManager) {
    var Service = require('./Service');
    var config = servicesManager.config;
    var Q = require('q');
    var _ = require('lodash');
    var self = servicesManager;
    var gitlab = require('gitlab');

    var api = gitlab({
      url: config.gitlab.protocol + '://' + config.gitlab.host,
      token: config.gitlab.token
    });
    servicesManager.services['gitlab'] = new Service('gitlab', servicesManager, api);
    servicesManager.services['gitlab'].registerStep('getProject');
    // register commands
    servicesManager.services['gitlab']
      .registerCommand('getProject', function () {
        console.log('START - gitlab.getProject()'.grey);
        var deferred = Q.defer();
        self.services.gitlab.api.projects.all(function (data) {
          if (_checkIfResponseIsError(data)) { // starts with 3 digits and the number is >= 400
            deferred.reject(data);
          }
          else { // data = projects
            var project;
            _.forEach(data, function (p) {
              if (p.name === config.gitlab.projectName) {
                project = p;
              }
            });
            if (_.isUndefined(project)) {
              deferred.reject('Project "' + config.gitlab.projectName + '" not found');
            }
            else {
              config.gitlab.project = project;
              deferred.resolve(project);
            }
            console.log('  END - gitlab.getProject()'.grey);
          }
        });
        return deferred.promise;
      })
      .registerCommand('createMergeRequest', function (args) {
        console.log('START - gitlab.createMergeRequest(%s)'.grey, args.refBranch);
        var deferred = Q.defer();
        var mrTitle;
        var refBranch = args.refBranch || 'master';

        if (!_.isUndefined(config.jira)) {
          mrTitle = config.jira.issueTypeSlug + '(' + config.jira.issueKey + '): ' + config.jira.issue.fields.summary;
        }
        else { // no Jira
          mrTitle = config.branchName;
        }
        self.services.gitlab.api.projects.merge_requests.add(config.gitlab.project.id, config.branchName, refBranch, null, mrTitle, function (data) {
          if (_checkIfResponseIsError(data)) { // starts with 3 digits and the number is >= 400
            deferred.reject(data);
          }
          else { // data = created mr
            deferred.resolve(data); // tmp while labels not supported
            // --------------------- LABELS
            // var params;
            // if (!_.isUndefined(config.jira)) {
            //   var mrLabels = [];
            //   mrLabels.push(config.gitlab.labelsMatching[config.jira.issueTypeSlug]);
            //   params = {
            //     labels: mrLabels
            //   };
            // }
            // else {
            //   params = {};
            // }
            // self.services.gitlab.api.projects.merge_requests.update(config.gitlab.project.id, data.id, params, function (data2) {
            //   if (_checkIfResponseIsError(data)) { // starts with 3 digits and the number is >= 400
            //     deferred.reject(data);
            //   }
            //   else {
            //     deferred.resolve(data);
            //     console.log('  END - gitlab.createMergeRequest(%s)'.grey, refBranch);
            //   }
            // });
          }
        });
        return deferred.promise;
      })
      .registerCommand('assignMergeRequest', function (args) {
        console.log('START - gitlab.assignMergeRequest(%s)'.grey, args.assignee);
        var deferred = Q.defer();

        var getAllMergeRequests = function () {
          var def = Q.defer();
          self.services.gitlab.api.projects.merge_requests.list(config.gitlab.project.id, { per_page: 1000, state: 'opened' }, function (data) {
            if (_checkIfResponseIsError(data)) { // starts with 3 digits and the number is >= 400
              def.reject(data);
            }
            else {
              def.resolve(data);
            }
          });
          return def.promise;
        };
        var getAllUsers = function () {
          var def = Q.defer();
          self.services.gitlab.api.users.all(function (data) {
            if (_checkIfResponseIsError(data)) { // starts with 3 digits and the number is >= 400
              def.reject(data);
            }
            else {
              def.resolve(data);
            }
          });
          return def.promise;
        };

        Q.all([
          getAllMergeRequests(),
          getAllUsers()
        ])
          .then(function (res) {
            var mrs = res[0]; var mr;
            var users = res[1]; var user;

            _.forEach(mrs, function (m) {
              if (m.source_branch === config.branchName) {
                mr = m;
              }
            });
            _.forEach(users, function (u) {
              if (u.username === args.assignee) {
                user = u;
              }
            });

            var params = {
              assignee_id: user.id
            };
            self.services.gitlab.api.projects.merge_requests.update(config.gitlab.project.id, mr.id, params, function (data) {
              if (_checkIfResponseIsError(data)) { // starts with 3 digits and the number is >= 400
                deferred.reject(data);
              }
              else {
                deferred.resolve(data);
                console.log('  END - gitlab.assignMergeRequest(%s)'.grey, args.assignee);
              }
            });
          });

        return deferred.promise;
      });
  },
  /**
   * Jira service
   * @param  {ServiceManager} servicesManager
   */
  jira: function (servicesManager) {
    var Service = require('./Service');
    var config = servicesManager.config;
    var Q = require('q');
    var _ = require('lodash');
    var self = servicesManager;
    var JiraApi = require('jira').JiraApi;

    var api = new JiraApi(config.jira.protocol, config.jira.host, null, config.jira.user, config.jira.pass, 'latest');
    servicesManager.services['jira'] = new Service('jira', servicesManager, api);
    servicesManager.services['jira'].registerStep('getIssue');
    // register commands
    servicesManager.services['jira']
      .registerCommand('getIssue', function () {
        console.log('START - jira.getIssue(%s)'.grey, config.jira.issueKey);
        return Q.ninvoke(self.services.jira.api, 'findIssue', config.jira.issueKey)
          .then(function (issue) {
            config.jira.issue = issue;
            console.log('        <%s> %s (assigned to %s)'.grey, issue.fields.issuetype.name, issue.fields.summary, (!_.isNull(issue.fields.assignee)) ? issue.fields.assignee.name : 'NO_ONE');
            console.log('  END - jira.getIssue(%s)'.grey, config.jira.issueKey);
            return issue;
          });
      })
      .registerCommand('assignIssue', function (args) {
        console.log('START - jira.assignIssue(%s)'.grey, config.jira.user);
        if (_.isNull(config.jira.issue.fields.assignee)) { // no one is asigned to this issue
          var params = {
            fields: {
              assignee: {
                name: config.jira.user
              }
            }
          };
          // assign developer to the issue
          return Q.ninvoke(self.services.jira.api, 'updateIssue', config.jira.issueKey, params)
            .then(function (data) {
              if (data === 'Success') {
                console.log('        Issue assigned to %s'.grey, config.jira.user);
              }
              console.log('  END - jira.assignIssue(%s)'.grey, config.jira.user);
              return data;
            });
        }
        else {
          return Q.when()
            .then(function (data) { console.log('  END - jira.assignIssue(%s)'.grey, config.jira.user); return data; });
        }
      })
      .registerCommand('changeIssueStatus', function (args) {
        console.log('START - jira.changeIssueStatus(%s)'.grey, args.status);
        return Q.ninvoke(self.services.jira.api, 'listTransitions', config.jira.issueKey)
          .then(function (transitions) {
            var issueTransition;
            _.forEach(transitions.transitions, function (t) {
              if (t.to.name === args.status) {
                issueTransition = {
                  transition: t
                };
              }
            });
            return Q.ninvoke(self.services.jira.api, 'transitionIssue', config.jira.issueKey, issueTransition);
          })
          .then(function (data) { console.log('  END - jira.changeIssueStatus(%s)'.grey, args.status); return data; });
      });

  }
};

/**
 * True if response body starts with 4XX or 5XX, false otherwise
 * @param  {String|Object} res
 * @return {Boolean}
 */
var _checkIfResponseIsError = function (res) {
  var _ = require('lodash');
  return _.isString(res) && parseInt(res.substr(0, 3), 10) >= 400;
};

/**
 * Class to handle the services used to perform the steps of the dev workflow
 * @param {Object} config Configuration needed to feed services and their APIs
 */
var ServiceManager = function (config) {
  this.config = config;
  this.services = {};
};

/**
 * Set the service to use its API and run the commands of the dev workflow config
 * @param {String} service
 */
ServiceManager.prototype.set = function (service) {
  var _ = require('lodash');

  if (!_.isUndefined(_setters[service])) { // function _setters.service is defined (see top of this file)
    _setters[service](this);
  }
  else {
    throw new Error('The service "' + service + '" is not supported.');
  }
};
/**
 * Create a promise using the index that relates to the action given as param
 * @param  {String} action
 * @param  {Object} args
 * @return {Q.Promise}
 */
ServiceManager.prototype.getPromiseForAction = function (action, args) {
  var splittedAction = action.split('.');
  var service = splittedAction[0];
  var command = splittedAction[1];
  var _ = require('lodash');

  if (_.isUndefined(this.services[service])) {
    throw new Error('Service ' + service + ' not available/initialized');
  }
  else {
    if (_.isUndefined(this.services[service].commands[command])) {
      throw new Error('Action ' + action + ' not available');
    }
    else {
      return this.services[service].commands[command](args);
    }
  }
};
/**
 * Get all the commands from all the registered services that need to be run before the dev workflow config steps
 * @return {Array}
 */
ServiceManager.prototype.getBeforeSteps = function () {
  var _ = require('lodash');
  var steps = [];
  _.forEach(this.services, function (service) {
    _.forEach(service.steps, function (step) {
      steps.push(step);
    });
  });
  return steps;
};

module.exports = ServiceManager;