var _ = require('lodash');
var path = require('path');
var starflow = require('../starflow');
var Task = require('../Task');
var updatePackageVersionFactory = require('../npm/updatePackageVersion');
var BaseExecutable = require('../Executable');

function UpdatePackageJson(helpers) {
  BaseExecutable.call(this, 'teads.updatePackageJson');
  if (!helpers) {
    throw new Error('Helpers from starflow-teads should be passed to UpdatePackageJson constructor');
  }
  this.helpers = helpers;
}
UpdatePackageJson.prototype = Object.create(BaseExecutable.prototype);
UpdatePackageJson.prototype.constructor = UpdatePackageJson;

UpdatePackageJson.prototype.getNpmVersionFromBranch = function getNpmVersionFromBranch(branch) {
  return _.kebabCase('0.0.0-' + branch.replace(/[^a-zA-Z0-9_.-]/g, '_').toLowerCase());
};

UpdatePackageJson.prototype.exec = function exec(branch, dependencyPath) {
  var dependency = this.helpers.parseDependency(dependencyPath);

  function prefixWithNodeModules(val) {
    return '/node_modules/' + val;
  }

  var pathName =  path.resolve('./' + _.initial(dependency.chain).map(prefixWithNodeModules).join('/'));
  var npmVersion = this.getNpmVersionFromBranch(branch);
  var description = 'Update ' + dependency.name + ' version to ' + npmVersion + ' in ' + pathName.replace(process.env.PWD, '.') + '/package.json';
  var executableChild = this.createExecutable(updatePackageVersionFactory);
  return new Task(executableChild, [pathName + '/package.json', dependency.name, npmVersion], null, description)
    .run();
};

module.exports = function (helpers) {
  return function () {
    return new UpdatePackageJson(helpers);
  };
};
