var _ = require('lodash');
var Promise = require('bluebird');
var starflow = require('../starflow');
var Task = require('../Task');
var updatePackageVersionFactory = require('../npm/updatePackageVersion');

function UpdatePackagesJson(helpers) {
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to UpdatePackagesJson constructor');
  }
  this.helpers = helpers;
}

UpdatePackagesJson.prototype.getNpmVersionFromBranch = function getNpmVersionFromBranch(branch) {
  return _.kebabCase('0.0.0-' + branch.replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase());
};

UpdatePackagesJson.prototype.exec = function (branch, dependencies) {
  var deps = this.helpers.parseDependencies(dependencies);
  var self = this;
  function prefixWithNodeModules(val) {
    return '/node_modules/' + val;
  }

  var promises = [];
  var pathName, packageName, npmVersion, description;
  _.forEach(deps, function (dep) {
    pathName =  './' + _.initial(dep.chain).map(prefixWithNodeModules).join('/');
    packageName = _.last(dep.chain);
    npmVersion = self.getNpmVersionFromBranch(branch);
    description = 'Update ' + packageName + ' version to ' + npmVersion;
    promises.push(new Task(updatePackageVersionFactory(), [pathName + '/package.json', packageName, npmVersion], null, description).run());
  });

  return Promise.all(promises);
};

module.exports = function (helpers) {
  return function () {
    return new UpdatePackagesJson(helpers);
  };
};
