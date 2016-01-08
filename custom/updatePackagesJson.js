var _ = require('lodash');
var Promise = require('bluebird');
var starflow = require('../starflow');
var Task = require('../Task');
var updatePackageVersionFactory = require('../npm/updatePackageVersion');

function UpdatePackagesJson(helpers) {
  this.helpers = helpers || {};
}

function getNpmVersionFromBranch(branch) {
  return '0.0.0-' + branch
    .replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase() // docker_name_friendly
    .replace(/[_.]/g, '-'); // npm_name_friendly
}

UpdatePackagesJson.prototype.exec = function (branch, dependencies) {
  var deps = this.helpers.parseDependencies(dependencies);
  function prefixWithNodeModules(val) {
    return '/node_modules/' + val;
  }

  var promises = [];
  var pathName, packageName, npmVersion, description;
  _.forEach(deps, function (dep) {
    pathName =  './' + _.initial(dep.chain).map(prefixWithNodeModules).join('/');
    packageName = _.last(dep.chain);
    npmVersion = getNpmVersionFromBranch(branch);
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
