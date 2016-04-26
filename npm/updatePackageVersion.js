var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

Promise.promisifyAll(fs);

function UpdatePackageVersion(parentNamespace) {
  BaseExecutable.call(this, 'npm.updatePackageVersion', parentNamespace);
}
UpdatePackageVersion.prototype = Object.create(BaseExecutable.prototype);
UpdatePackageVersion.prototype.constructor = UpdatePackageVersion;

UpdatePackageVersion.prototype.exec = function (packageJsonPath, name, version) {
  packageJsonPath = path.resolve(packageJsonPath);

  return fs
    .readFileAsync(packageJsonPath, 'utf8')
    .then(function (data) {
      var result = data.replace(new RegExp('("' + name +'":\\s*")(.+)"'), '\$1' + version + '"');
      return fs
        .writeFileAsync(packageJsonPath, result, 'utf8')
        .then(function () {
          var currentDirPath = path.resolve('.');
          starflow.logger.log('Successfully updated the "' + name + '" version to "' + version + '" in "' + packageJsonPath.replace(currentDirPath + '/', '') + '".');
        });
    });
};

module.exports = function (parentNamespace) {
  return new UpdatePackageVersion(parentNamespace);
};
