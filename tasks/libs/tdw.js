module.exports = {


  init: function (config) {
    this.config = config;
    this.config.branchTpl = this.config.branchTpl ? this.config.branchTpl : '{{ tdw_issueType }}({{ tdw_issueKey }}):{{ tdw_issueDesc }}';
    return this;
  },

  run: function () {
    var Q = require('q');
    var _ = require('lodash');
    var ServiceManager = require('./ServiceManager');

    var config = this.config;
    var steps = config.steps;
    var servicesManager = new ServiceManager(config);

    // -----
    // BEGIN
    // -----
    var getUsedServices = function (steps) {
      var used = [];
      var service;

      _.forEach(steps, function (step) {
        if (_.isObject(step)) {
          service = Object.keys(step)[0];
        }
        else {
          service = step;
        }
        service = service.split('.')[0];
        if (used.indexOf(service) === -1) { // service is not added yet
          used.push(service);
        }
      });
      return used;
    };
    var usedServices = getUsedServices(steps);

    // usedServices.push('jira');
    // usedServices.push('gitlab');

    _.forEach(usedServices, function (service) {
      try {
        servicesManager.set(service);
      }
      catch (err) {
        console.log('%s'.red, err);
        // deferred.reject(err);
      }
    });

    // TODO get issue number from branch name if "branchTpl" matches branch name
    if (usedServices.indexOf('jira') !== -1) {
      var regx = new RegExp(config.jira.projectKey + '-(\\d+)');
      // start git service if not defined
      if (_.isUndefined(servicesManager.services.git)) {
        servicesManager.set('git');
      }
      // TODO put this into a command of the service
      var currentBranch = servicesManager.services.git.api.getBranchesSync().current;
      var branchTplRegexified = config.branchTpl.replace(/\//g, '\\/?')
        .replace(/\{\{\s*issueType\s*\}\}/, '')
        .replace(/\{\{\s*issueKey\s*\}\}/, config.jira.projectKey+'-(\\d+)')
        .replace(/\{\{\s*issueDesc\s*\}\}/, '([a-zA-Z-]*)');
      var branchRegx = new RegExp(branchTplRegexified);
      config.jira.issueNum = currentBranch.match(branchRegx)[1];
      config.jira.issueDesc = currentBranch.match(branchRegx)[2];
      config.jira.issueKey = config.jira.projectKey + '-' + config.jira.issueNum;
    }

    var buildBranchName = function () {
      if (!/^\d+$/.test(config.jira.issueNum)) { // no issue key given
        config.branchName = config.jira.issueNum || 'unicorn';
      }
      else {
        // get issueType "slug"
        var issueType = _.find(_.invert(config.jira.issueTypesMatching), function (val, key) {
          return key === config.jira.issue.fields.issuetype.name;
        });
        issueType = issueType || 'unicorn';
        config.jira.issueTypeSlug = issueType;

        // process branch template
        config.branchName = config.branchTpl.replace(/\{\{\s*issueType\s*\}\}/, issueType)
          .replace(/\{\{\s*issueKey\s*\}\}/, config.jira.issueKey)
          .replace(/\{\{\s*issueDesc\s*\}\}/, config.jira.issueDesc || '');

        // remove special chars at the beginning or at the end of the branchName
        // e.g. the tpl is devType/issue/desc but no desc is provided --> a/b instead if a/b/ for the branch name
        config.branchName = config.branchName.replace(/(?:^([^a-z0-9()]*))|(?:([^a-z0-9()]*)$)/g, '');
      }
    };

    var runPromisesSequence = function (promises, name) {
      var i = 0;
      var fn = function () {
        var sequence = Q.when(), action, args;

        // stopping condition
        if (i < promises.length) {
          action = _.isString(promises[i]) ? promises[i] : Object.keys(promises[i])[0];
          args = _.isString(promises[i]) ? {} : promises[i][action];

          sequence = servicesManager.getPromiseForAction(action, args)
            .then(function () { i++; })
            .then(fn)
            .catch(function (err) {
              console.log('Promises sequence "%s" failed at step %s.'.red, name, i);
              throw err;
            });

          if (i === promises.length - 1) {
            sequence
              .then(function () {
                console.log('Promises sequence "%s" is finished.'.green, name);
              });
          }
        }

        return sequence;
      };
      console.log('Starting promises sequence "%s"...', name);
      return fn();
    };

    var beforeSteps = servicesManager.getBeforeSteps();
    return runPromisesSequence(beforeSteps, 'Before Steps')
      .then(function () {
        try {
          buildBranchName();
        }
        catch (err) {
          console.log('Error while building branch name. Make sure one of your steps uses Jira if you are giving an issue key'.red);
          throw err;
        }
        return runPromisesSequence(steps, 'Config Steps');
      });
  }

};