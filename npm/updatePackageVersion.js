var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var starflow = require('../starflow');

Promise.promisifyAll(fs);

function UpdatePackageVersion() {

}

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

module.exports = function () {
  return new UpdatePackageVersion();
};
