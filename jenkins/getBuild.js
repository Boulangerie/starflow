var jenkinsService = require('./jenkinsService');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function GetBuild() {
  BaseExecutable.call(this, 'jenkins.getBuild');
}

GetBuild.prototype = Object.create(BaseExecutable.prototype);
GetBuild.prototype.constructor = GetBuild;

GetBuild.prototype.exec = function exec(jobName, buildNumber) {
  return jenkinsService.build.get(jobName, buildNumber)
    .then(function (data) {
      starflow.logger.success('Build information of #' + buildNumber + ' got successfully');
      this.storage.set('build', data);
    }.bind(this), function (err) {
      starflow.logger.error('Could not get build information ' + err);
      throw err;
    });

};

module.exports = function () {
  return new GetBuild();
};
