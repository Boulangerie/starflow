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
      _ = require('lodash'),
      Util = require('./Util'),
      LogService = require('./LogService'),
      deferred = Q.defer();

  var args = _.merge({
    path: {
      projectId: Util.config.jira.projectId
    }
  }, self.apiConfig);

  LogService.debug('START Jira.checkConnection()');

  self.apiClient.methods.getSession(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      LogService.success('Connection to JIRA established.');
      deferred.resolve(data);
    }

    LogService.debug('END   Jira.checkConnection()');
  });

  return deferred.promise;
};

Jira.prototype.checkIssue = function () {
  var self = this,
      Q = require('q'),
      _ = require('lodash'),
      Util = require('./Util'),
      LogService = require('./LogService'),
      deferred = Q.defer();

  LogService.debug('START Jira.checkIssue()');

  var args = _.merge({
    path: {
      project: Util.config.jira.project,
      issue: Util.config.jira.issueKey
    }
  }, self.apiConfig);

  self.apiClient.methods.getOneIssue(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      if (data.total === 1) {
        LogService.success('JIRA issue "' + Util.config.jira.issueKey + '" was found.');
        self.issue = data.issues[0];

        deferred.resolve(data.issues[0]);

        LogService.debug('END   Jira.checkIssue()');

        // assign card to user if not already assigned to him
        /*var args2 = _.merge({
          headers: {
            "Content-Type": "application/json"
          },
          path: {
            issue: Util.config.jira.issueKey
          },
          data: {
            fields: {
              assignee: {
                name: Util.config.jira.credentials.user
              }
            }
          }
        }, self.apiConfig);

        if (!exports.jiraCard.fields.assignee || (exports.jiraCard.fields.assignee && exports.jiraCard.fields.assignee.name !== config.jira.credentials.user)) {
          jiraClient.methods.putIssue(args2, function (data2, response2) {
            if (response2.statusCode !== 204) {
              grunt.log.debug(response2.client._httpMessage.path + '\n', data2);
              deferred.reject(new Error(data2.errorMessages || 'Error ' + response2.statusCode + ' (no message given)'));
            }
            else {
              grunt.log.writeln('JIRA card "' + cardname + '" assigned to ' + config.jira.credentials.user + '.');
              deferred.resolve(data.issues[0]);
            }
          });
          // end assign card to user if not already assigned to him
        }
        else { // the issue has already been assigned to the developer
          deferred.resolve(data.issues[0]);
        }*/

      }
      else if (data.total === 0) {
        LogService.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error('The following JIRA card could not be found for the project "' + Util.config.jira.project + '": ' + Util.config.jira.issueKey));
      }
      else {
        LogService.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error('More than 1 JIRA card has been found with the string "' + Util.config.jira.issueKey + '".'));
      }
    }
  });

  return deferred.promise;
};

Jira.prototype.changeStatus = function (status) {
  console.log('change status to ' + status);
};

module.exports = Jira;