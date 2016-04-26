var _ = require('lodash');
var path = require('path');
var Promise = require('bluebird');
var starflow = require('../starflow');
var Task = require('../Task');
var createBranchFactory = require('../git/createBranch');
var BaseExecutable = require('../BaseExecutable');

function CreateBranchDependencies(parentNamespace, helpers) {
  BaseExecutable.call(this, 'teads.createBranchDependencies', parentNamespace);
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to CreatePullRequests constructor');
  }
  this.helpers = helpers;
}
CreateBranchDependencies.prototype = Object.create(BaseExecutable.prototype);
CreateBranchDependencies.prototype.constructor = CreateBranchDependencies;

CreateBranchDependencies.prototype.exec = function (branch, dependencies) {
  var deps = this.helpers.parseDependencies(dependencies);
  var promises = _.map(deps, function (dep) {
    var pathName = _.reduce(dep.chain, function (prev, current) {
      return prev + 'node_modules/' + current + '/';
    }, './');
    var fullPath = path.resolve(pathName);
    return new Task(createBranchFactory(this.namespace, {cwd: fullPath}), [branch, true]).run();
  }.bind(this));

  return Promise.all(promises)
    .then(function () {
      starflow.logger.log('Branch "' + branch + '" created and checked out on: ' + _.pluck(deps, 'name').join(', '));
    })
    .catch(function (err) {
      starflow.logger.warning('Error when creating and checking out "' + branch + '" branch on one the following dependencies: ' + _.pluck(deps, 'name').join(', '));
      throw err;
    });
};

module.exports = function (helpers) {
  return function (parentNamespace) {
    return new CreateBranchDependencies(parentNamespace, helpers);
  };
};
