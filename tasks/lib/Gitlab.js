var Gitlab = function () {
  var Client = require('node-rest-client').Client;
  var Util = require('./Util');

  this.apiClient = new Client();
  this.apiConfig = {
    headers: {
      "PRIVATE-TOKEN": Util.config.gitlab.token
    },
    path: {
      url: Util.config.gitlab.host
    }
  };

  this.labels = [];

  this.apiClient.registerMethod('getAllMergeRequests', '${url}/api/v3/projects/${projectId}/merge_requests', 'GET');
  this.apiClient.registerMethod('getOneMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}', 'GET');
  this.apiClient.registerMethod('getOneBranch', '${url}/api/v3/projects/${projectId}/repository/branches/${branch}', 'GET');
  this.apiClient.registerMethod('getAllLabels', '${url}/api/v3/projects/${projectId}/labels', 'GET');
  this.apiClient.registerMethod('getAllUsers', '${url}/api/v3/users', 'GET');
  this.apiClient.registerMethod('getCurrentUser', '${url}/api/v3/user', 'GET');
  this.apiClient.registerMethod('getAllProjects', '${url}/api/v3/projects', 'GET');
  this.apiClient.registerMethod('postMergeRequest', '${url}/api/v3/projects/${projectId}/merge_requests', 'POST');
  this.apiClient.registerMethod('putMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}', 'PUT');
  this.apiClient.registerMethod('putAcceptMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}/merge', 'PUT');
};
Gitlab.prototype.constructor = Gitlab;

/**
 * Get the ID of the project which name is in the config (Gruntfile)
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.getProjectId = function () {
  var self = this,
    Q = require('q'),
    _ = require('lodash'),
    Util = require('./Util'),
    LogService = require('./LogService'),
    projectName = Util.config.gitlab.project,
    deferred = Q.defer();

  LogService.debug('START Gitlab.getProjectId()');

  var args = _.merge({
    parameters: {
      per_page: 1000
    }
  }, self.apiConfig);

  self.apiClient.methods.getAllProjects(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      var id = null,
        i = 0;
      while (!id && i < data.length) {
        if (data[i].name === projectName) {
          id = data[i].id;
        }
        i++;
      }

      if (id) {
        LogService.success('The ID for the Gitlab project "' + Util.config.gitlab.project + '" was found: ' + id);
        deferred.resolve(id);
      }
      else {
        deferred.reject(new Error('Gitlab project named "' + projectName + '" could not be found.'));
      }

      LogService.debug('END   Gitlab.getProjectId()');
    }
  });

  return deferred.promise;
};

/**
 * Check if the user can connect to the Gitlab API with its credentials
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.checkConnection = function () {
  var self = this,
    Q = require('q'),
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Gitlab.checkConnection()');

  self.apiClient.methods.getCurrentUser(self.apiConfig, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      LogService.success('Connection to GitLab established.');
      deferred.resolve(data);
    }

    LogService.debug('END   Gitlab.checkConnection()');
  });

  return deferred.promise;
};

/**
 * Check if the working branch already exists on the remote repository
 * @param branch {string}
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.branchExistsOnRemote = function (branch) {
  var self = this,
    Q = require('q'),
    _ = require('lodash'),
    Util = require('./Util'),
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Gitlab.branchExistsOnRemote(' + branch + ')');

  var args = _.merge({
    path: {
      projectId: Util.config.gitlab.projectId,
      branch: branch
    }
  }, self.apiConfig);

  self.apiClient.methods.getOneBranch(args, function (data, response) {
    if (response.statusCode !== 200) {
      if (response.statusCode === 404) {
        deferred.resolve(false);
      }
      else {
        LogService.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
      }
    }
    else {
      deferred.resolve(true);
    }

    LogService.debug('END   Gitlab.branchExistsOnRemote(' + branch + ')');
  });

  return deferred.promise;
};

/**
 * Create a merge request on the project on Gitlab between the working branch and 'refBranch'
 * @param refBranch {string}
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.createMergeRequest = function (refBranch) {
  var self = this,
    Q = require('q'),
    Util = require('./Util'),
    _ = require('lodash'),
    Index = require('./Index'),
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Gitlab.createMergeRequest(' + refBranch + ')');

  var mrTitle = Util.config.typeDev + '(' + Index.jira.issue.key + '): ' + Index.jira.issue.fields.summary;

  // put in an external function?
  var mrLabels = [];
  // make sure typeDev (e.g. 'feat') is an available type (see list in Util.config.availableTypesDev). Almost useless because of typeMatches var in ttdev.js
  if (_.contains(Util.config.availableTypesDev, Util.config.typeDev)) {
    // make sure the labels given in Gitlab config in Gruntfile exist on the Gitlab project
    var labelsFromConfig = Util.config.gitlab.labels[Util.config.typeDev];
    if (!_.isUndefined(labelsFromConfig)) {
      // transform labels in array if it was a string (single label)
      labelsFromConfig = _.isString(labelsFromConfig) ? [labelsFromConfig] : labelsFromConfig;
      for (var i = 0; i < labelsFromConfig.length; i++) {
        if (_.contains(self.labels, labelsFromConfig[i])) {
          mrLabels.push(labelsFromConfig[i]);
        }
      }
    }
  }
  // end

  var args = _.merge({
    headers: {
      "Content-Type": "application/json"
    },
    data: {
      "id": Util.config.gitlab.projectId,
      "source_branch": Index.git.workingBranch,
      "target_branch": refBranch,
      "title": mrTitle,
      "labels": mrLabels
    },
    path: {
      projectId: Util.config.gitlab.projectId
    }
  }, self.apiConfig);

  self.apiClient.methods.postMergeRequest(args, function (data, response) {
    if (response.statusCode !== 201) { // 201 = HTTP CREATED
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      LogService.success('Merge request "' + args.data.title + '" successfully created.');
      deferred.resolve(data);
    }
    LogService.debug('END   Gitlab.createMergeRequest(' + refBranch + ')');
  });

  return deferred.promise;
};

/**
 * Get the Merge Request object from Gitlab API between the working branch and 'refBranch'
 * @param refBranch {string}
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.getMergeRequest = function () {
  var self = this,
    Q = require('q'),
    Util = require('./Util'),
    _ = require('lodash'),
    Index = require('./Index'),
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Gitlab.getMergeRequest()');

  var args = _.merge({
    parameters: {
      state: 'opened'
    },
    path: {
      projectId: Util.config.gitlab.projectId
    }
  }, self.apiConfig);

  self.apiClient.methods.getAllMergeRequests(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      var mr = null,
        i = 0;
      while (!mr && i < data.length) {
        if (data[i].source_branch === Index.git.workingBranch) { // TODO be careful, it might lead to a bug (mission target_branch) if several merge requests for the working branch
          mr = data[i];
        }
        i++;
      }

      if (mr) {
        deferred.resolve(mr);
      }
      else {
        deferred.reject(new Error('Merge request for the project "' + Util.config.gitlab.project + '" could not be found.'));
      }
    }
    LogService.debug('END   Gitlab.getMergeRequest()');
  });

  return deferred.promise;
};

/**
 * Get the user object from Gitlab API that matches the username 'username'
 * @param username {string}
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.getUserFromUsername = function (username) {
  var self = this,
    Q = require('q'),
    _ = require('lodash'),
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Gitlab.getUserFromUsername(' + username + ')');

  var args = _.merge({
    parameters: {
      per_page: 1000
    }
  }, self.apiConfig);

  self.apiClient.methods.getAllUsers(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      var user = null,
        i = 0;
      while (!user && i < data.length) {
        if (data[i].username === username) {
          user = data[i];
        }
        i++;
      }

      if (user) {
        deferred.resolve(user);
      }
      else {
        deferred.reject(new Error('User with the username "' + username + '" could not be found.'));
      }
    }
    LogService.debug('END   Gitlab.getUserFromUsername(' + username + ')');
  });

  return deferred.promise;
};

/**
 * Assign 'assignee' to review the merge request related to the working branch
 * @param assignee {string} username
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.assignMergeRequest = function (assignee) {
  var self = this,
    Q = require('q'),
    Util = require('./Util'),
    _ = require('lodash'),
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Gitlab.assignMergeRequest(' + assignee + ')');

  self.getMergeRequest().then(function (mr) {

    self.getUserFromUsername(assignee).then(function (user) {

      var args = _.merge({
        headers: {
          "Content-Type": "application/json"
        },
        data: {
          assignee_id: user.id
        },
        path: {
          projectId: Util.config.gitlab.projectId,
          mrId: mr.id
        }
      }, self.apiConfig);

      self.apiClient.methods.putMergeRequest(args, function (data, response) {
        if (response.statusCode !== 200) {
          LogService.debug(response.client._httpMessage.path + '\n', data);
          deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
        }
        else {
          LogService.success('Merge request "' + mr.title + '" assigned to ' + assignee + '.');
          deferred.resolve(data);
        }

        LogService.debug('END   Gitlab.assignMergeRequest(' + assignee + ')');
      });

    }, function (err) {
      deferred.reject(new Error(err));
    });

  }, function (err) {
    deferred.reject(new Error(err));
  });

  return deferred.promise;
};

/**
 * Accept the merge request for the working branch
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.acceptMergeRequest = function () {
  var self = this,
    Q = require('q'),
    Util = require('./Util'),
    _ = require('lodash'),
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Gitlab.acceptMergeRequest()');

  self.getMergeRequest().then(function (mr) {

    var args = _.merge({
      headers: {
        "Content-Type": "application/json"
      },
      path: {
        projectId: Util.config.gitlab.projectId,
        mrId: mr.id
      },
      data: {}
    }, self.apiConfig);

    self.apiClient.methods.putAcceptMergeRequest(args, function (data, response) {
      if (response.statusCode !== 200) {
        LogService.error('URL -> ' + response.client._httpMessage.path + '\n', data); // error not debug
        deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        LogService.success('Merge request "' + mr.title + '" has been accepted!');
        deferred.resolve(data);
      }

      LogService.debug('END   Gitlab.acceptMergeRequest()');
    });

  }, function (err) {
    deferred.reject(new Error(err));
  });

  return deferred.promise;
};

Gitlab.prototype.getLabels = function () {
  var self = this,
    Q = require('q'),
    _ = require('lodash'),
    LogService = require('./LogService'),
    deferred = Q.defer();

  LogService.debug('START Gitlab.getLabels()');

  var args = _.merge({
    path: {
      projectId: Util.config.gitlab.projectId
    }
  }, self.apiConfig);

  self.apiClient.methods.getAllLabels(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.message || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      // transform [{name: 'label1'}, {...}] into ['label1', '...']
      self.labels = data.map(function (label) {
        return label.name;
      });
      deferred.resolve(data);
    }
    LogService.debug('END   Gitlab.getLabels()');
  });

  return deferred.promise;
};

module.exports = Gitlab;