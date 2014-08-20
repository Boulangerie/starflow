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

  this.apiClient.registerMethod('getAllMergeRequests', '${url}/api/v3/projects/${projectId}/merge_requests', 'GET');
  this.apiClient.registerMethod('getOneMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}', 'GET');
  this.apiClient.registerMethod('getOneBranch', '${url}/api/v3/projects/${projectId}/repository/branches/${branch}', 'GET');
  this.apiClient.registerMethod('getAllUsers', '${url}/api/v3/users', 'GET');
  this.apiClient.registerMethod('getCurrentUser', '${url}/api/v3/user', 'GET');
  this.apiClient.registerMethod('getAllProjects', '${url}/api/v3/projects', 'GET');
  this.apiClient.registerMethod('postMergeRequest', '${url}/api/v3/projects/${projectId}/merge_requests', 'POST');
  this.apiClient.registerMethod('putMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}', 'PUT');
  this.apiClient.registerMethod('putAcceptMergeRequest', '${url}/api/v3/projects/${projectId}/merge_request/${mrId}/merge', 'PUT');
};
Gitlab.prototype.constructor = Gitlab;

/**
 * Check if the user can connect to the Gitlab API with its credentials
 * @returns {promise|Q.promise}
 */
Gitlab.prototype.checkConnection = function () {
  var self = this,
      Q = require('q'),
      LogService = require('LogService'),
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

module.exports = Gitlab;