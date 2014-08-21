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
 * Get the ID of the project which name is in the config (Gruntfile)
 * @param projectName {string}
 * @returns {promise|Q.promise}
 */
Jira.prototype.setProjectId = function () {
  var self = this,
      Q = require('q'),
      Util = require('./Util'),
      LogService = require('./LogService'),
      projectName = Util.config.jira.project,
      deferred = Q.defer();

  LogService.debug('START Jira.setProjectId()');

  self.apiClient.methods.getAllProjects(self.apiConfig, function (data, response) {
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
        LogService.success('The ID for the project "' + Util.config.jira.project + '" was found: ' + id);
        deferred.resolve(id);
      }
      else {
        deferred.reject(new Error('JIRA project named "' + projectName + '" could not be found.'));
      }

      LogService.debug('END   Jira.setProjectId()');
    }
  });

  return deferred.promise;
};

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
      project: Util.config.jira.projectId,
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

        ////////////////////////////////////////////////
        // [BEGIN] Assign Jira issue to the developer //
        ////////////////////////////////////////////////
        // if no one is assigned OR if someone is but it's not the developer running the workflow
        if (_.isNull(self.issue.fields.assignee) || (!_.isNull(self.issue.fields.assignee) && self.issue.fields.assignee.name !== Util.config.jira.credentials.user)) {
          // assign card to user if not already assigned to him
          var args2 = _.merge({
            headers: {
              "Content-Type": "application/json"
            },
            path: {
              issue: self.issue.key
            },
            data: {
              fields: {
                assignee: {
                  name: Util.config.jira.credentials.user
                }
              }
            }
          }, self.apiConfig);

          self.apiClient.methods.putIssue(args2, function (data2, response2) {
            if (response2.statusCode !== 204) {
              LogService.debug(response.client._httpMessage.path + '\n', data);
              deferred.reject(new Error(data2.errorMessages || 'Error ' + response2.statusCode + ' (no message given)'));
            }
            else {
              LogService.success('JIRA card "' + self.issue.key + '" assigned to ' + Util.config.jira.credentials.user + '.');
              deferred.resolve(data.issues[0]);
            }

            LogService.debug('END   Jira.checkIssue()');
          });
          // end assign card to user if not already assigned to him
        }
        else { // the issue has already been assigned to the developer
          LogService.debug('END   Jira.checkIssue()');
          deferred.resolve(data.issues[0]);
        }
        ////////////////////////////////////////////////
        // [ END ] Assign Jira issue to the developer //
        ////////////////////////////////////////////////

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

Jira.prototype.getStatusesGroupByIssuetype = function () {
  var self = this,
      Q = require('q'),
      LogService = require('./LogService'),
      deferred = Q.defer();

  var args = _.merge({
    path: {
      project: config.jira.projectId
    }
  }, self.apiConfig);

  LogService.debug('START Jira.getStatusesGroupByIssuetype()');

  self.apiClient.methods.getAllProjectStatuses(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      var map = {};
      for (var i = 0; i < data.length; i++) {
        map[data[i].name] = data[i].statuses.map(function (status) { return status.name; } );
      }
      deferred.resolve(map);
    }

    LogService.debug('END   Jira.getStatusesGroupByIssuetype()');
  });

  return deferred.promise;
};

/**
 * Get the object status from the API
 * @param status {string}
 * @returns {promise|Q.promise}
 */
Jira.prototype.getStatusObject = function (status) {
  var self = this,
      Q = require('q'),
      _ = require('lodash'),
      LogService = require('./LogService'),
      deferred = Q.defer();

  var args = _.merge({
    path: {
      issue: self.issue.key
    }
  }, self.apiConfig);

  LogService.debug('START Jira.getStatusObject(' + status + ')');

  self.apiClient.methods.getAllIssueTransitions(args, function (data, response) {
    if (response.statusCode !== 200) {
      LogService.debug(response.client._httpMessage.path + '\n', data);
      deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
    }
    else {
      data = data.transitions;
      var jiraStatus = null,
          i = 0;
      while (!jiraStatus && i < data.length) {
        if (data[i].to.name === status) {
          jiraStatus = data[i];
        }
        i++;
      }

      if (jiraStatus) {
        deferred.resolve(jiraStatus);
        LogService.debug('END   Jira.getStatusObject(' + status + ')');
      }
      else {
        // if the status object for 'status' (arg) was not found, help user with a list of available status for this issue
        self.getIssueStatusesGroupByIssuetype().then(function (res) {
          var availableStatuses = '',
            issuetypes = Object.keys(res);

          for (var i = 0; i < issuetypes.length; i++) {
            availableStatuses += '  - [' + issuetypes[i] + '] ' + res[issuetypes[i]].join(', ') + '\n';
          }
          deferred.reject(new Error('JIRA status "' + status + '" could not be found (case sensitive).\nUse --debug flag to see the list of available statuses.'));
          LogService.debug('Available JIRA statuses:\n  - [issue type] list of available statuses\n\n' + availableStatuses);

          LogService.debug('END   Jira.getStatusObject(' + status + ')');

        }, function (err) { // error from getIssueStatusesGroupByIssuetype
          deferred.reject(err);
        });
      }
    }
  });

  return deferred.promise;
};

/**
 * change the status of a card/issue (move it to a column)
 * @param status {string}
 * @returns {promise|Q.promise}
 */
Jira.prototype.changeStatus = function (status) {
  var self = this,
      Q = require('q'),
      _ = require('lodash'),
      LogService = require('./LogService'),
      deferred = Q.defer();

  LogService.debug('START Jira.changeStatus(' + status + ')');

  self.getStatusObject(status).then(function (statusObject) {

    var args = _.merge({
      headers: {
        "Content-Type": "application/json"
      },
      path: {
        issue: self.issue.key
      },
      data: {
        transition: {
          id: statusObject.id
        }
      }
    }, self.apiConfig);

    self.apiClient.methods.postIssueTransition(args, function (data, response) {
      if (response.statusCode !== 204) {
        LogService.debug(response.client._httpMessage.path + '\n', data);
        deferred.reject(new Error(data.errorMessages || 'Error ' + response.statusCode + ' (no message given)'));
      }
      else {
        LogService.success('JIRA card ' + self.issue.key + ' moved to ' + statusObject.to.name + '.');
        deferred.resolve(data);
      }
      LogService.debug('END   Jira.changeStatus(' + status + ')');
    });
  }, function (err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

module.exports = Jira;