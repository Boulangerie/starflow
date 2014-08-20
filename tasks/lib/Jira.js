var Jira = function () {
  var Client = require('node-rest-client').Client;
  var Util = require('./Util');

  this.apiClient = new Client(Util.config.jira.credentials);
  this.apiConfig = {
    path: {
      url: Util.config.jira.host
    }
  };

  this.issue = null;

  this.apiClient.registerMethod('getAllIssueTransitions', '${url}/rest/api/latest/issue/${issue}/transitions', 'GET');
  this.apiClient.registerMethod('getAllProjectStatuses', '${url}/rest/api/latest/project/${project}/statuses', 'GET');
  this.apiClient.registerMethod('getOneIssue', '${url}/rest/api/latest/search?jql=project=${project} and issue=${issue}', 'GET');
  this.apiClient.registerMethod('postIssueTransition', '${url}/rest/api/latest/issue/${issue}/transitions', 'POST');
  this.apiClient.registerMethod('putIssue', '${url}/rest/api/latest/issue/${issue}', 'PUT');
  this.apiClient.registerMethod('getSession', '${url}/rest/auth/latest/session', 'GET');
  this.apiClient.registerMethod('getAllProjects', '${url}/rest/api/latest/project', 'GET');
};
Jira.prototype.constructor = Jira;

/**
 * Check if the user can connect to the Jira API with its credentials
 * @returns {promise|Q.promise}
 */
Jira.prototype.checkConnection = function () {
  var self = this,
      Q = require('q'),
      LogService = require('./LogService'),
      deferred = Q.defer();

  var args = _.merge({
    path: {
      projectId: Util.config.jira.projectId
    }
  }, self.apiConfig);

  LogService.debug('START Jira.checkConncetion()');

  self.apiClient.methods.getSession(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      LogService.success('Connection to JIRA established.');
      deferred.resolve(data);
    }

    LogService.debug('END   Jira.checkConncetion()');
  });

  return deferred.promise;
};

module.exports = Jira;