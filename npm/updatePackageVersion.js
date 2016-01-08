var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var starflow = require('../starflow');

function UpdatePackageVersion() {

}

UpdatePackageVersion.prototype.exec = function (packageJsonPath, name, version) {
  packageJsonPath = path.resolve(packageJsonPath);

  return new Promise(function (resolve, reject) {
    fs.readFile(packageJsonPath, 'utf8', function (err, data) {
      if (err) {
        reject(err);
        return;
      }
      var result = data.replace(new RegExp('("' + name +'":\\s*")(.+)"'), '\$1' + version + '"');
      fs.writeFile(packageJsonPath, result, 'utf8', function (err) {
        if (err) {
          reject(err);
          return;
        }
        var currentDirPath = path.resolve('.');
        starflow.logger.log('Successfully updated the "' + name + '" version to "' + version + '" in "' + packageJsonPath.replace(currentDirPath + '/', '') + '".');
        resolve(result);
      });
    });
  });
};

module.exports = function () {
  return new UpdatePackageVersion();
};
