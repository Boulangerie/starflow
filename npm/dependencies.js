var Q = require('q');
var _ = require('lodash');
var fs = require('fs');
var starflow = require('../starflow');

function Dependencies() {

}

Dependencies.prototype.get = function get(path, includeVersion) {
  var packageJson = JSON.parse(fs.readFileSync(path + '/package.json', 'utf-8'));
  var dependencies = _.assign({}, packageJson.dependencies || {}, packageJson.devDependencies || {});

  function displayDependencies(deps) {
    var i = 0;
    var len = _.size(deps);
    var bulletPoint;
    _.forEach(deps, function (version, name) {
      bulletPoint = (i < len - 1) ? ' ├ ' : ' └ ';
      starflow.logger.log(bulletPoint + name + ' (' + version + ')');
      i++;
    });
  }

  starflow.logger.log(_.size(_.keys(packageJson.dependencies)) + ' dependencies found');
  displayDependencies(packageJson.dependencies);

  starflow.logger.log(_.size(_.keys(packageJson.devDependencies)) + ' devDependencies found');
  displayDependencies(packageJson.devDependencies);

  if (!includeVersion) {
    dependencies = _.keys(dependencies);
  }

  _.set(starflow.flow, 'npm.dependencies', dependencies);
  return starflow.flow;
};

Dependencies.prototype.exec = function exec(path, includeVersion) {
  path = path || '.';
  path = path.replace(/\/$/, ''); // remove last character if it's a '/'
  return this.get(path, !!includeVersion);
};

module.exports = Dependencies;
